import axios from 'axios'

// This will use VUE_APP_API_URL from Render environment
// Fallback to localhost for development
const API_URL = process.env.VUE_APP_API_URL || 'http://localhost/ccs-profiling-system/backend/api'

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
      try {
        let endpoint = '';
        
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
        
        console.log('API_URL:', API_URL)
        console.log('Login endpoint:', endpoint)
        
        const response = await axios.post(endpoint, {
          username: credentials.username,
          password: credentials.password,
          role: credentials.role
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('Response:', response.data)
        
        if (response.data.success) {
          commit('SET_TOKEN', response.data.token)
          commit('SET_USER', response.data.user)
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
          return response.data
        } else {
          throw new Error(response.data.message || 'Login failed')
        }
      } catch (error) {
        console.error('Login error details:', error)
        if (error.response) {
          console.error('Error response:', error.response.data)
          console.error('Status:', error.response.status)
        }
        throw error
      }
    },
    
    logout({ commit }) {
      commit('CLEAR_AUTH')
      delete axios.defaults.headers.common['Authorization']
    },
    
    checkAuth({ state, commit }) {
      if (state.token && state.user && state.user.role) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        return true
      }
      return false
    }
  },
  
  getters: {
    isAuthenticated: state => !!(state.token && state.user && state.user.role),
    user: state => state.user,
    userRole: state => state.user?.role || null,
    userName: state => state.user?.name || null,
    userId: state => state.user?.id || null,
    studentNumber: state => state.user?.student_number || null
  }
}