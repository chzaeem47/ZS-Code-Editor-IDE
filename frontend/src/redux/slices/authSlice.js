import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/axios";

// ===============================
// SIGNUP
// ===============================
export const signupUser = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/auth/signup", userData);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Signup failed",
        }
      );
    }
  }
);

// ===============================
// LOGIN
// ===============================
export const loginUser = createAsyncThunk(
  "auth/login",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/auth/login", userData);

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Login failed",
        }
      );
    }
  }
);

// ===============================
// GOOGLE LOGIN
// ===============================
export const googleLoginUser = createAsyncThunk(
  "auth/google",
  async (token, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/auth/google", { token });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: error.message || "Google Login failed",
        }
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",

  initialState: {
    user: null,
    loading: false,
    error: null,
  },

  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    logoutLocal: (state) => {
      state.user = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ===============================
      // SIGNUP
      // ===============================
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload.user;
      })

      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.payload?.error ||
          "Signup failed";
      })

      // ===============================
      // LOGIN
      // ===============================
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload.user;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.payload?.error ||
          "Login failed";
      })

      // ===============================
      // GOOGLE LOGIN
      // ===============================
      .addCase(googleLoginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(googleLoginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.user = action.payload.user;
      })

      .addCase(googleLoginUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.payload?.error ||
          "Google Login failed";
      });
  },
});

export const { clearError, logoutLocal } = authSlice.actions;

export default authSlice.reducer;