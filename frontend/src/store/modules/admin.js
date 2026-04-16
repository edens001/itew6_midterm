import axios from 'axios'

// Use environment variable for API URL
// For production on Render, this should be set in Render dashboard
// For local development, use localhost
const API_URL = process.env.VUE_APP_API_URL 
  ? `${process.env.VUE_APP_API_URL}/admin` 
  : 'http://localhost/ccs-profiling-system/backend/api/admin'

export default {
  namespaced: true,
  
  state: {
    dashboardData: null,
    students: [],
    faculty: [],
    courses: [],
    schedules: []
  },
  
  mutations: {
    SET_DASHBOARD_DATA(state, data) {
      state.dashboardData = data
    },
    
    SET_STUDENTS(state, students) {
      state.students = students
    },
    
    SET_FACULTY(state, faculty) {
      state.faculty = faculty
    },
    
    SET_COURSES(state, courses) {
      state.courses = courses
    },
    
    SET_SCHEDULES(state, schedules) {
      state.schedules = schedules
    }
  },
  
  actions: {
    async getDashboardData({ commit, rootState }) {
      try {
        // Get token from auth module
        const token = rootState.auth?.token
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        
        const response = await axios.get(`${API_URL}/dashboard.php`, { headers })
        commit('SET_DASHBOARD_DATA', response.data)
        return response.data
      } catch (error) {
        console.error('Dashboard data fetch error:', error)
        throw error
      }
    },
    
    async getStudents({ commit, rootState }, params = {}) {
      try {
        const token = rootState.auth?.token
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        
        const response = await axios.get(`${API_URL}/students/`, { params, headers })
        commit('SET_STUDENTS', response.data)
        return response.data
      } catch (error) {
        console.error('Students fetch error:', error)
        throw error
      }
    },
    
    async createStudent({ dispatch, rootState }, studentData) {
      try {
        const token = rootState.auth?.token
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        
        const response = await axios.post(`${API_URL}/students/`, studentData, { headers })
        await dispatch('getStudents')
        return response.data
      } catch (error) {
        console.error('Student creation error:', error)
        throw error
      }
    },
    
    async updateStudent({ dispatch, rootState }, { id, data }) {
      try {
        const token = rootState.auth?.token
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        
        const response = await axios.put(`${API_URL}/students/update.php?id=${id}`, data, { headers })
        await dispatch('getStudents')
        return response.data
      } catch (error) {
        console.error('Student update error:', error)
        throw error
      }
    },
    
    async deleteStudent({ dispatch, rootState }, id) {
      try {
        const token = rootState.auth?.token
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        
        const response = await axios.delete(`${API_URL}/students/delete.php?id=${id}`, { headers })
        await dispatch('getStudents')
        return response.data
      } catch (error) {
        console.error('Student deletion error:', error)
        throw error
      }
    }
  },
  
  getters: {
    dashboardData: state => state.dashboardData,
    students: state => state.students,
    faculty: state => state.faculty,
    courses: state => state.courses,
    schedules: state => state.schedules
  }
}