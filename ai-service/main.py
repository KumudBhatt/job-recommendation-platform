from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import spacy
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
import os
from dotenv import load_dotenv
import requests
from datetime import datetime
import base64
import io
from PyPDF2 import PdfReader
from docx import Document
from sklearn.feature_extraction.text import TfidfVectorizer

# Load environment variables
load_dotenv()

app = FastAPI(title="Job Recommendation AI Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
nlp = spacy.load("en_core_web_sm")
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
model = AutoModel.from_pretrained("bert-base-uncased")

# Move model to GPU if available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

class ResumeData(BaseModel):
    resumeId: str
    fileContent: str  # base64 encoded content
    fileType: str

class JobData(BaseModel):
    id: str
    title: str
    description: str
    requirements: Dict[str, Any]

class Skill(BaseModel):
    name: str
    level: Optional[str] = None

class Experience(BaseModel):
    title: str
    company: str
    duration: str
    description: Optional[str] = None

class Education(BaseModel):
    degree: str
    institution: str
    year: str
    field: Optional[str] = None

class UserProfile(BaseModel):
    skills: List[Skill]
    experience: List[Experience]
    education: List[Education]

class JobRequirement(BaseModel):
    skills: List[str]
    experience: Optional[int] = 0
    education: Optional[str] = None
    type: str = "required"
    certifications: Optional[List[str]] = None

class Job(BaseModel):
    id: str
    title: str
    description: str
    requirements: List[JobRequirement]

class RecommendationRequest(BaseModel):
    userProfile: UserProfile
    jobs: List[Job]

def get_bert_embedding(text: str) -> np.ndarray:
    """Generate BERT embeddings for a given text."""
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Use CLS token embedding
    embeddings = outputs.last_hidden_state[:, 0, :].cpu().numpy()
    return embeddings[0]

def extract_skills(text: str) -> List[str]:
    """Extract skills from text using spaCy."""
    doc = nlp(text)
    skills = []
    
    # Extract noun phrases and named entities
    for chunk in doc.noun_chunks:
        if len(chunk.text.split()) <= 3:  # Avoid long phrases
            skills.append(chunk.text.lower())
    
    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "GPE"]:
            skills.append(ent.text.lower())
    
    return list(set(skills))

def calculate_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """Calculate cosine similarity between two embeddings."""
    return float(cosine_similarity([embedding1], [embedding2])[0][0])

def calculate_skill_match(user_skills: List[Skill], job_skills: List[str]) -> tuple:
    user_skill_names = [skill.name.lower() for skill in user_skills]
    job_skill_names = [skill.lower() for skill in job_skills]
    
    # Calculate matching skills
    matching_skills = [skill for skill in job_skill_names if skill in user_skill_names]
    
    # Calculate match score
    if not job_skill_names:
        return 0, []
    
    match_score = len(matching_skills) / len(job_skill_names) * 100
    return match_score, matching_skills

@app.post("/parse-resume")
async def parse_resume(resume_data: ResumeData):
    """Parse resume file and extract structured information."""
    try:
        # Decode base64 content
        file_content = base64.b64decode(resume_data.fileContent)
        file_buffer = io.BytesIO(file_content)
        
        # Extract text based on file type
        if resume_data.fileType == "application/pdf":
            reader = PdfReader(file_buffer)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
        else:  # docx
            doc = Document(file_buffer)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        
        # Extract information using NLP
        doc = nlp(text)
        
        # Extract name (usually first line)
        name = text.split('\n')[0] if text else "Unknown"
        
        # Extract email
        email = ""
        for token in doc:
            if '@' in token.text:
                email = token.text
                break
        
        # Extract phone (basic pattern)
        phone = ""
        for token in doc:
            if token.like_num and len(token.text.replace('-', '').replace(' ', '')) >= 10:
                phone = token.text
                break
        
        # Extract skills
        skills = extract_skills(text)
        
        # Extract experience (basic implementation)
        experience = []
        current_company = None
        current_position = None
        
        for sent in doc.sents:
            if any(org in sent.text.lower() for org in ['inc', 'ltd', 'corp', 'company']):
                current_company = sent.text.strip()
            elif current_company and not current_position:
                current_position = sent.text.strip()
                experience.append({
                    "company": current_company,
                    "position": current_position,
                    "duration": "Not specified"
                })
        
        # Extract education (basic implementation)
        education = []
        education_keywords = ['university', 'college', 'school', 'degree', 'bachelor', 'master', 'phd']
        
        for sent in doc.sents:
            if any(keyword in sent.text.lower() for keyword in education_keywords):
                education.append({
                    "institution": sent.text.strip(),
                    "degree": "Not specified",
                    "year": "Not specified"
                })
        
        return {
            "name": name,
            "email": email,
            "phone": phone,
            "skills": skills,
            "experience": experience,
            "education": education
        }
        
    except Exception as e:
        print(f"Error parsing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-resume")
async def analyze_resume(resume_data: Dict[str, Any]):
    """Analyze resume and generate insights."""
    try:
        parsed_data = resume_data["parsedData"]
        
        # Generate embeddings for different sections
        skills_text = " ".join([skill["name"] for skill in parsed_data["skills"]])
        experience_text = " ".join([exp["description"] for exp in parsed_data["experience"]])
        education_text = " ".join([edu["institution"] + " " + edu["degree"] for edu in parsed_data["education"]])
        
        skill_embedding = get_bert_embedding(skills_text)
        experience_embedding = get_bert_embedding(experience_text)
        education_embedding = get_bert_embedding(education_text)
        
        # Calculate overall score
        overall_score = np.mean([
            np.linalg.norm(skill_embedding),
            np.linalg.norm(experience_embedding),
            np.linalg.norm(education_embedding)
        ])
        
        # Identify strengths and areas for improvement
        strengths = []
        areas_for_improvement = []
        
        # Analyze skills
        if len(parsed_data["skills"]) > 5:
            strengths.append("Strong technical skillset")
        else:
            areas_for_improvement.append("Consider adding more technical skills")
        
        # Analyze experience
        if len(parsed_data["experience"]) > 2:
            strengths.append("Rich work experience")
        else:
            areas_for_improvement.append("Consider gaining more work experience")
        
        return {
            "skillEmbeddings": skill_embedding.tolist(),
            "experienceEmbeddings": experience_embedding.tolist(),
            "educationEmbeddings": education_embedding.tolist(),
            "overallScore": float(overall_score),
            "strengths": strengths,
            "areasForImprovement": areas_for_improvement
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend")
async def get_recommendations(request: RecommendationRequest):
    try:
        recommendations = []
        
        for job in request.jobs:
            # Calculate skill match
            match_score, matching_skills = calculate_skill_match(
                request.userProfile.skills,
                job.requirements[0].skills if job.requirements else []
            )
            
            # Create recommendation
            recommendation = {
                "jobId": job.id,
                "title": job.title,
                "description": job.description,
                "matchScore": round(match_score, 2),
                "skillMatch": matching_skills,
                "message": None
            }
            
            # Add message based on match score
            if match_score < 30:
                recommendation["message"] = "Low match - Consider improving required skills"
            elif match_score < 60:
                recommendation["message"] = "Medium match - Some skills need improvement"
            else:
                recommendation["message"] = "High match - Good fit for your profile"
            
            recommendations.append(recommendation)
        
        # Sort recommendations by match score
        recommendations.sort(key=lambda x: x["matchScore"], reverse=True)
        
        return recommendations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001) 