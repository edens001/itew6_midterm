<template>
  <div class="app-wrapper">
    <FacultySidebar />
    
    <div class="main-content">
      <TopNav :pageTitle="'My Profile'" />
      
      <div class="container-fluid">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading profile...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="alert alert-danger d-flex align-items-center mb-4">
          <i class="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
          <div class="flex-grow-1">
            <strong>Error!</strong> {{ error }}
          </div>
          <button class="btn btn-sm btn-outline-danger ms-3" @click="fetchProfile">
            <i class="bi bi-arrow-clockwise"></i> Retry
          </button>
        </div>

        <!-- Profile Content -->
        <template v-else>
          <div class="row">
            <!-- Profile Card -->
            <div class="col-md-4 mb-4">
              <div class="profile-card">
                <div class="profile-cover"></div>
                <div class="profile-avatar-wrapper">
                  <div class="profile-avatar">
                    {{ userInitials }}
                  </div>
                </div>
                <div class="profile-body text-center">
                  <h4 class="mb-1">{{ profile.full_name }}</h4>
                  <p class="text-muted mb-2">{{ profile.faculty_number }}</p>
                  
                  <div class="d-flex justify-content-center gap-2 mb-3">
                    <span class="badge bg-success">{{ profile.employment_status }}</span>
                    <span class="badge bg-info">{{ profile.designation }}</span>
                  </div>

                  <hr>

                  <div class="profile-stats">
                    <div class="stat-item">
                      <div class="stat-value">{{ summary.total_classes }}</div>
                      <div class="stat-label">Classes</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{ summary.total_subjects }}</div>
                      <div class="stat-label">Subjects</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{ summary.total_sections }}</div>
                      <div class="stat-label">Sections</div>
                    </div>
                  </div>

                  <hr>

                  <div class="text-start">
                    <div class="info-item">
                      <i class="bi bi-envelope text-primary"></i>
                      <span>{{ profile.email }}</span>
                    </div>
                    <div class="info-item">
                      <i class="bi bi-telephone text-primary"></i>
                      <span>{{ profile.contact_number || 'Not provided' }}</span>
                    </div>
                    <div class="info-item">
                      <i class="bi bi-building text-primary"></i>
                      <span>{{ profile.department }}</span>
                    </div>
                    <div class="info-item">
                      <i class="bi bi-briefcase text-primary"></i>
                      <span>{{ profile.designation }}</span>
                    </div>
                  </div>

                  <hr>

                  <button class="btn btn-outline-primary w-100" @click="editProfile">
                    <i class="bi bi-pencil me-2"></i> Edit Profile
                  </button>
                </div>
              </div>
            </div>

            <!-- Details -->
            <div class="col-md-8 mb-4">
              <div class="details-card mb-4">
                <div class="card-header">
                  <i class="bi bi-person me-2"></i>
                  <h5 class="mb-0">Personal Information</h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="text-muted">First Name</label>
                      <p class="fw-bold">{{ profile.first_name }}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="text-muted">Last Name</label>
                      <p class="fw-bold">{{ profile.last_name }}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="text-muted">Middle Name</label>
                      <p class="fw-bold">{{ profile.middle_name || '—' }}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="text-muted">Username</label>
                      <p class="fw-bold">{{ profile.username }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="details-card mb-4">
                <div class="card-header">
                  <i class="bi bi-briefcase me-2"></i>
                  <h5 class="mb-0">Professional Information</h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="text-muted">Department</label>
                      <p class="fw-bold">{{ profile.department }}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="text-muted">Designation</label>
                      <p class="fw-bold">{{ profile.designation }}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="text-muted">Specialization</label>
                      <p class="fw-bold">{{ profile.specialization || '—' }}</p>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="text-muted">Date Hired</label>
                      <p class="fw-bold">{{ formatDate(profile.date_hired) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'
import FacultySidebar from '@/components/layout/FacultySidebar.vue'
import TopNav from '@/components/layout/TopNav.vue'
import Swal from 'sweetalert2'

export default {
  name: 'FacultyProfile',
  components: {
    FacultySidebar,
    TopNav
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const loading = ref(true)
    const error = ref(null)
    const profile = ref({})
    const summary = ref({
      total_classes: 0,
      total_subjects: 0,
      total_sections: 0
    })

    const API_URL = 'http://localhost/ccs-profiling-system/backend/api'

    const userInitials = computed(() => {
      const name = profile.value.full_name || 'Faculty'
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    })

    const fetchProfile = async () => {
      loading.value = true
      error.value = null
      
      try {
        const token = store.state.auth.token
        if (!token) {
          router.push('/faculty/login')
          return
        }

        const response = await axios.get(`${API_URL}/faculty/profile.php`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.data.success) {
          profile.value = response.data.profile
          summary.value = response.data.summary
        }
      } catch (err) {
        console.error('Profile error:', err)
        error.value = err.response?.data?.message || 'Failed to load profile'
        
        if (err.response?.status === 401) {
          await store.dispatch('auth/logout')
          router.push('/faculty/login')
        }
      } finally {
        loading.value = false
      }
    }

    const formatDate = (date) => {
      if (!date) return '—'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const editProfile = () => {
      Swal.fire({
        title: 'Edit Profile',
        text: 'This feature is coming soon!',
        icon: 'info'
      })
    }

    onMounted(() => {
      fetchProfile()
    })

    return {
      loading,
      error,
      profile,
      summary,
      userInitials,
      formatDate,
      editProfile
    }
  }
}
</script>

<style scoped>
.app-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: #f8f9fa;
  width: 100%;
}

.main-content {
  flex: 1;
  margin-left: 280px;
  width: calc(100% - 280px);
  min-height: 100vh;
  padding: 25px;
  transition: margin-left 0.3s ease;
  background-color: #f8f9fa;
}

:deep(.sidebar.sidebar-collapsed) ~ .main-content {
  margin-left: 80px;
  width: calc(100% - 80px);
}

.container-fluid {
  padding: 0;
  max-width: 1400px;
  margin: 0 auto;
}

.content-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  padding: 30px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 3px solid #f0f0f0;
}

.header-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #27ae60, #229954);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.header-icon i {
  font-size: 2rem;
  color: white;
}

.profile-card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.05);
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #27ae60, #229954);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.profile-avatar i {
  font-size: 4rem;
  color: white;
}

.info-card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.05);
}

.text-muted {
  font-size: 0.85rem;
  margin-bottom: 5px;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0 !important;
    width: 100% !important;
    padding: 15px;
  }
}
</style>