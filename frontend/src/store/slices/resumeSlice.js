import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Async thunks
export const fetchResume = createAsyncThunk(
  'resume/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/resumes/me`, {
        headers: getAuthHeader()
      });
      return response.data[0]; // Get the most recent resume
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createResume = createAsyncThunk(
  'resume/createResume',
  async (resumeData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/resumes`, resumeData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateResume = createAsyncThunk(
  'resume/updateResume',
  async (resumeData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_URL}/resumes`, resumeData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const uploadResume = createAsyncThunk(
  'resume/upload',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove file extension for title
      formData.append('isPublic', 'false');

      const response = await axios.post(`${API_URL}/resumes`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Upload error:', error.response?.data);
      return rejectWithValue(error.response?.data || { message: 'Failed to upload resume' });
    }
  }
);

export const parseResume = createAsyncThunk(
  'resume/parseResume',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/resumes/parse`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  resume: null,
  loading: false,
  error: null,
  uploadProgress: 0,
  parsedData: null
};

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Resume
      .addCase(fetchResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResume.fulfilled, (state, action) => {
        state.loading = false;
        state.resume = action.payload;
      })
      .addCase(fetchResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch resume';
      })
      // Create Resume
      .addCase(createResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createResume.fulfilled, (state, action) => {
        state.loading = false;
        state.resume = action.payload;
      })
      .addCase(createResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create resume';
      })
      // Update Resume
      .addCase(updateResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateResume.fulfilled, (state, action) => {
        state.loading = false;
        state.resume = action.payload;
      })
      .addCase(updateResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update resume';
      })
      // Upload Resume File
      .addCase(uploadResume.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadProgress = 100;
        state.resume = action.payload;
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to upload resume';
      })
      // Parse Resume
      .addCase(parseResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(parseResume.fulfilled, (state, action) => {
        state.loading = false;
        state.parsedData = action.payload;
      })
      .addCase(parseResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to parse resume';
      });
  }
});

export const { setUploadProgress, clearError } = resumeSlice.actions;
export default resumeSlice.reducer;