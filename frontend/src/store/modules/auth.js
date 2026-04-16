import axios from 'axios'
import router from '@/router'

// Use environment variable for production, localhost for development
const API_URL = process.env.VUE_APP_API_URL || 'http://localhost/ccs-profiling-system/backend/api'

// TEMPORARY TEST CREDENTIALS - REMOVE AFTER FIXING BACKEND
const TEST_CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123', role: 'admin', name: 'Test Admin', email: 'admin@test.com' },
  faculty: { username: 'faculty1', password: 'faculty123', role: 'faculty', name: 'Test Faculty', email: 'faculty@test.com' },
  student: { username: '2020-12345', password: 'student123', role: 'student', name: 'Test Student', email: 'student@test.com' }
}

export default {
  namespaced: true,
  
  state: {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    isAuthenticated: !!localStorage.getItem('token')
  },
  
  mutations: {
    SET_TOKEN(state, token) {
      state.token = token
      state.isAuthenticated = !!token
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    },
    
    SET_USER(state, user) {
      state.user = user
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      } else {
        localStorage.removeItem('user')
      }
    },
    
    CLEAR_AUTH(state) {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      // ========== TEMPORARY BYPASS FOR TESTING ==========
      // Check if using test credentials
      const testUser = TEST_CREDENTIALS[credentials.role];
      if (testUser && 
          credentials.username === testUser.username && 
          credentials.password === testUser.password) {
        console.warn('⚠️ USING TEMPORARY HARDCODED LOGIN - REMOVE IN PRODUCTION');
        
        const fakeToken = 'test_token_' + Date.now();
        const userData = {
          id: 999,
          username: testUser.username,
          name: testUser.name,
          email: testUser.email,
          role: testUser.role,
          first_name: testUser.name.split(' ')[0],
          last_name: testUser.name.split(' ')[1] || 'User'
        };
        
        commit('SET_TOKEN', fakeToken);
        commit('SET_USER', userData);
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${fakeToken}`
        
        return {
          success: true,
          token: fakeToken,
          user: userData
        };
      }
      // ========== END OF TEMPORARY BYPASS ==========
      
      // ========== REAL API LOGIN ==========
      try {
        let endpoint = '';
        
        // Determine which login endpoint to use
        switch(credentials.role) {
          case 'admin':
          case 'dean':
          case 'dept_chair':
          case 'secretary':
            endpoint = `${API_URL}/admin/auth/login.php`;
            break;
          case 'faculty':
            endpoint = `${API_URL}/faculty/auth/login.php`;
            break;
          case 'student':
            endpoint = `${API_URL}/student/auth/login.php`;
            break;
          default:
            endpoint = `${API_URL}/auth/login.php`;
        }
        
        console.log('=== LOGIN DEBUG INFO ===');
        console.log('API_URL:', API_URL);
        console.log('Full endpoint:', endpoint);
        console.log('Credentials:', { 
          username: credentials.username, 
          role: credentials.role,
          passwordLength: credentials.password?.length 
        });
        
        const response = await axios.post(endpoint, {
          username: credentials.username,
          password: credentials.password,
          role: credentials.role
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        })
        
        console.log('Response status:', response.status);
        console.log('Login response:', response.data);
        
        if (response.data.success) {
          commit('SET_TOKEN', response.data.token)
          commit('SET_USER', response.data.user)
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
          
          return response.data
        } else {
          throw new Error(response.data.message || 'Login failed');
        }
      } catch (error) {
        console.error('=== LOGIN ERROR DETAILS ===');
        if (error.code === 'ECONNABORTED') {
          console.error('Request timeout - backend might be down or slow');
        } else if (error.response) {
          console.error('Error status:', error.response.status);
          console.error('Error data:', error.response.data);
          console.error('Error headers:', error.response.headers);
        } else if (error.request) {
          console.error('No response received - backend may be unreachable');
          console.error('Request object:', error.request);
        } else {
          console.error('Error message:', error.message);
        }
        
        throw error
      }
    },
    
    logout({ commit }) {
      console.log('Logging out...')
      commit('CLEAR_AUTH')
      delete axios.defaults.headers.common['Authorization']
      // Redirect to login page if needed
      if (router.currentRoute.path !== '/login') {
        router.push('/login')
      }
    },
    
    checkAuth({ state, commit }) {
      // Validate that user data exists
      if (state.token && state.user && state.user.role) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        return true
      } else if (state.token && (!state.user || !state.user.role)) {
        // Corrupted auth state - clear it
        console.log('Corrupted auth state detected, clearing...')
        commit('CLEAR_AUTH')
        return false
      }
      return false
    }
  },
  
  getters: {
    isAuthenticated: state => {
      // Only consider authenticated if both token and user role exist
      return !!(state.token && state.user && state.user.role)
    },
    user: state => state.user,
    userRole: state => state.user?.role || null,
    userName: state => state.user?.name || null,
    userId: state => state.user?.id || null,
    studentNumber: state => state.user?.student_number || null
  }
}