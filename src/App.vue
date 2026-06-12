<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-12">
        <div class="card simple-card">
          <div class="card-header simple-header d-flex justify-content-between align-items-center">
            <h4 class="mb-0">Category Management</h4>
            <button class="btn btn-outline-primary btn-sm" @click="openCreateModal">+ Add</button>
          </div>
          <div class="card-body p-3">
            <!-- Loading Spinner -->
            <div v-if="loading" class="text-center my-4">
              <div class="spinner-border text-primary" role="status"></div>
            </div>

            <!-- Category Table -->
            <table v-else class="table align-middle table-borderless mb-0">
              <thead class="table-light">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="category in categories" :key="category.id">
                  <td>{{ category.id }}</td>
                  <td>{{ category.name }}</td>
                  <td>{{ category.description }}</td>
                  <td>
                    <span :class="['status-badge', category.is_active ? 'active' : 'inactive']">
                      {{ category.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary me-2 action-btn" @click="editCategory(category)">✏️</button>
                    <button class="btn btn-sm btn-outline-danger action-btn" @click="deleteCategory(category.id)">🗑️</button>
                  </td>
                </tr>
                <tr v-if="categories.length === 0">
                  <td colspan="5" class="text-center">No categories found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for Create/Edit -->
    <div v-if="showModal" class="modal fade show d-block modal-backdrop" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Edit Category' : 'Create Category' }}</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <form @submit.prevent="saveCategory">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Name</label>
                <input v-model="form.name" type="text" class="form-control" required placeholder="Enter category name">
              </div>
              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea v-model="form.description" class="form-control" rows="3" placeholder="Enter description"></textarea>
              </div>
              <div class="form-check form-switch">
                <input v-model="form.is_active" class="form-check-input" type="checkbox" id="isActive">
                <label class="form-check-label" for="isActive">Is Active</label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-link text-muted" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary px-4" :disabled="saving">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { categoryService } from './services/api';

const categories = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref<number | null>(null);

const form = ref({
  name: '',
  description: '',
  is_active: true

});

// Fetch all categories
const fetchCategories = async () => {
  loading.value = true;
  try {
    const response = await categoryService.getAll();
    // Handle both { data: [...] } (standard API) and [...] (json-server) structures
    categories.value = response.data.data || response.data;

  } catch (error: any) {
    alert('Error fetching categories: ' + error.message);

  } finally {
    loading.value = false;

  }

};

// Open Modal for Create
const openCreateModal = () => {
  isEditing.value = false;
  form.value = { name: '', description: '', is_active: true };
  showModal.value = true;

};

// Open Modal for Edit
const editCategory = (category: any) => {
  isEditing.value = true;
  currentId.value = category.id;
  form.value = { ...category };
  showModal.value = true;

};

const closeModal = () => {
  showModal.value = false;

};

// Save (Create or Update)
const saveCategory = async () => {
  saving.value = true;
  try {
    if (isEditing.value) {
      await categoryService.update(currentId.value, form.value);

    } else {
      await categoryService.create(form.value);

    }
    await fetchCategories();
    closeModal();

  } catch (error: any) {
    alert('Error saving category: ' + (error.response?.data?.message || error.message));

  } finally {
    saving.value = false;

  }

};

// Delete Category
const deleteCategory = async (id: any) => {
  if (confirm('Are you sure you want to delete this category?')) {
    try {
      await categoryService.delete(id);
      await fetchCategories();

    } catch (error: any) {
      alert('Error deleting category: ' + error.message);

    }

  }

};

onMounted(fetchCategories);
</script>


<!-- <style scoped>
.modal {
  display: block;
}

.container {
  max-width: 900px;
}

.simple-card {
  border: 1px solid #eef1f3;
  box-shadow: none;
}

.simple-header {
  background: transparent;
  border-bottom: 1px solid #eef1f3;
  padding: 18px 20px;
}

.simple-header h4 {
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #fff;
}

.status-badge.active {
  background: #2f855a;
}

.status-badge.inactive {
  background: #e53e3e;
}

.action-btn {
  width: 36px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  background: rgba(0,0,0,0.35);
}

@media (max-width: 576px) {
  .simple-header { padding: 12px 14px; }
  .container { padding-left: 8px; padding-right: 8px; }
}
</style> -->