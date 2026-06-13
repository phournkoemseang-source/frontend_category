<template>
  <div class="page-shell">
    <section class="page-card">
      <header class="page-header">
        <div>
          <p class="eyebrow">Admin workspace</p>
          <h1>Category Management</h1>
          <p class="page-subtitle">Create, update, and organize categories in a clean, responsive interface.</p>
        </div>

        <div class="header-actions">
          <div class="metric-card">
            <span>Total</span>
            <strong>{{ categories.length }}</strong>
          </div>
          <div class="metric-card metric-card-active">
            <span>Active</span>
            <strong>{{ activeCount }}</strong>
          </div>
          <button class="primary-action" type="button" @click="openCreateModal">
            <span>+</span>
            Add Category
          </button>
        </div>
      </header>

      <div v-if="toast.show" class="toast" :class="toast.type" role="status">
        {{ toast.message }}
      </div>

      <div v-if="loading" class="state-card">
        <div class="spinner" aria-hidden="true"></div>
        <p>Loading categories</p>
      </div>

      <div v-else-if="categories.length === 0" class="state-card">
        <div class="empty-icon" aria-hidden="true">+</div>
        <h2>No categories yet</h2>
        <p>Create your first category to get started.</p>
        <button class="secondary-action" type="button" @click="openCreateModal">Create category</button>
      </div>

      <div v-else class="table-wrap">
        <table class="category-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Status</th>
              <th class="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in categories" :key="category.id">
              <td>
                <strong>{{ category.name }}</strong>
              </td>
              <td>
                <span class="description-cell">{{ category.description || 'No description' }}</span>
              </td>
              <td>
                <span :class="['status-pill', category.is_active ? 'active' : 'inactive']">
                  {{ category.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="icon-button edit" type="button" @click="editCategory(category)" aria-label="Edit category">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 21v4h4Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="m13.5 6.5 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
                <button class="icon-button delete" type="button" @click="deleteCategory(category.id)" aria-label="Delete category">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 7h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    <path d="M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M9 7V5h6v2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <transition name="modal-fade">
      <div v-if="showModal" class="modal-layer" @click.self="closeModal" @keydown.esc="closeModal">
        <div
          class="modal-panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="isEditing ? 'edit-modal-title' : 'create-modal-title'"
        >
          <div class="modal-top">
            <div>
              <p class="modal-kicker">{{ isEditing ? 'Update record' : 'New category' }}</p>
              <h2 :id="isEditing ? 'edit-modal-title' : 'create-modal-title'">
                {{ isEditing ? 'Edit Category' : 'Create Category' }}
              </h2>
            </div>
            <button class="close-button" type="button" @click="closeModal" aria-label="Close modal">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveCategory">
            <div class="form-grid">
              <label class="field">
                <span>Name</span>
                <input v-model="form.name" type="text" required placeholder="e.g. Electronics" autocomplete="off" />
              </label>
              <label class="field field-full">
                <span>Description</span>
                <textarea v-model="form.description" rows="4" placeholder="Describe this category"></textarea>
              </label>
            </div>

            <div class="switch-row">
              <input v-model="form.is_active" id="isActive" class="switch-input" type="checkbox" />
              <label for="isActive" class="switch-label">
                <span class="switch-track" aria-hidden="true">
                  <span class="switch-thumb"></span>
                </span>
                <span>Keep this category active</span>
              </label>
            </div>

            <div class="modal-actions">
              <button class="ghost-button" type="button" @click="closeModal">Cancel</button>
              <button class="save-button" type="submit" :disabled="saving">
                <span v-if="saving" class="button-spinner" aria-hidden="true"></span>
                {{ saving ? 'Saving...' : 'Save category' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { categoryService } from './services/api';

type Category = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
};

type CategoryForm = {
  name: string;
  description: string;
  is_active: boolean;
};

type ToastType = 'success' | 'error';

type ToastState = {
  show: boolean;
  type: ToastType;
  message: string;
};

const categories = ref<Category[]>([]);
const loading = ref(false);
const saving = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref<number | null>(null);
const toast = ref<ToastState>({
  show: false,
  type: 'error',
  message: ''
});

let toastTimer: number | undefined;

const form = ref<CategoryForm>({
  name: '',
  description: '',
  is_active: true
});

const activeCount = computed(() => categories.value.filter((category) => category.is_active).length);

const resetToast = (): ToastState => ({
  show: false,
  type: 'error',
  message: ''
});

const showToast = (type: ToastType, message: string) => {
  window.clearTimeout(toastTimer);
  toast.value = {
    show: true,
    type,
    message
  };

  toastTimer = window.setTimeout(() => {
    toast.value = resetToast();
  }, 3500);
};

const getErrorMessage = (error: unknown, fallback = 'Something went wrong.') => {
  const axiosError = error as {
    message?: string;
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return axiosError.response?.data?.message || axiosError.message || fallback;
};

const fetchCategories = async () => {
  loading.value = true;

  try {
    const response = await categoryService.getAll();
    const payload = response.data as { data?: Category[] } | Category[];
    categories.value = Array.isArray(payload) ? payload : payload.data ?? [];
  } catch (error) {
    showToast('error', getErrorMessage(error, 'Unable to load categories.'));
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  isEditing.value = false;
  currentId.value = null;
  form.value = {
    name: '',
    description: '',
    is_active: true
  };
  showModal.value = true;
};

const editCategory = (category: Category) => {
  isEditing.value = true;
  currentId.value = category.id;
  form.value = {
    name: category.name,
    description: category.description,
    is_active: category.is_active
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveCategory = async () => {
  const payload: CategoryForm = {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    is_active: form.value.is_active
  };

  saving.value = true;

  try {
    if (isEditing.value) {
      if (currentId.value === null) {
        throw new Error('Category id is missing.');
      }

      await categoryService.update(currentId.value, payload);
      showToast('success', 'Category updated successfully.');
    } else {
      await categoryService.create(payload);
      showToast('success', 'Category created successfully.');
    }

    await fetchCategories();
    closeModal();
  } catch (error) {
    showToast('error', getErrorMessage(error, 'Unable to save category.'));
  } finally {
    saving.value = false;
  }
};

const deleteCategory = async (id: number) => {
  if (!window.confirm('Are you sure you want to delete this category?')) {
    return;
  }

  try {
    await categoryService.delete(id);
    await fetchCategories();
    showToast('success', 'Category deleted successfully.');
  } catch (error) {
    showToast('error', getErrorMessage(error, 'Unable to delete category.'));
  }
};

onMounted(fetchCategories);

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer);
});
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
  padding: 40px 24px;
  color: #172033;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 34%),
    radial-gradient(circle at bottom right, rgba(6, 182, 212, 0.16), transparent 30%),
    linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
}

.page-card {
  max-width: 1120px;
  margin: 0 auto;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 28px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(18px);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 32px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.eyebrow,
.modal-kicker {
  margin: 0 0 8px;
  color: #6366f1;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.page-header h1,
.modal-top h2 {
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.04em;
}

.page-header h1 {
  font-size: clamp(28px, 4vw, 42px);
}

.page-subtitle {
  max-width: 560px;
  margin: 10px 0 0;
  color: #64748b;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  align-items: stretch;
  gap: 12px;
  flex-wrap: wrap;
}

.metric-card {
  min-width: 96px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
}

.metric-card span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.metric-card strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 24px;
  line-height: 1;
}

.metric-card-active {
  color: #fff;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border-color: transparent;
}

.metric-card-active span {
  color: rgba(255, 255, 255, 0.78);
}

.metric-card-active strong {
  color: #fff;
}

.primary-action,
.secondary-action,
.save-button,
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 16px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.primary-action {
  min-height: 56px;
  padding: 0 18px;
  color: #fff;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border: 0;
  box-shadow: 0 16px 30px rgba(79, 70, 229, 0.24);
}

.primary-action span {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  line-height: 1;
}

.primary-action:hover,
.secondary-action:hover,
.save-button:hover:not(:disabled),
.ghost-button:hover {
  transform: translateY(-2px);
}

.toast {
  margin: 24px 32px 0;
  padding: 14px 16px;
  border-radius: 16px;
  font-weight: 800;
  border: 1px solid;
  animation: slideDown 0.24s ease;
}

.toast.success {
  color: #047857;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.toast.error {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fecaca;
}

.table-wrap {
  overflow-x: auto;
  padding: 0 32px 32px;
}

.category-table {
  width: 100%;
  min-width: 720px;
  border-collapse: separate;
  border-spacing: 0 10px;
}

.category-table thead th {
  padding: 0 16px 8px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-align: left;
  text-transform: uppercase;
}

.category-table tbody tr {
  background: rgba(248, 250, 252, 0.92);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.category-table tbody tr:hover {
  background: #fff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.category-table td {
  padding: 18px 16px;
  color: #475569;
  vertical-align: middle;
  border-top: 1px solid #eef2f7;
  border-bottom: 1px solid #eef2f7;
}

.category-table td:first-child {
  border-left: 1px solid #eef2f7;
  border-radius: 18px 0 0 18px;
}

.category-table td:last-child {
  border-right: 1px solid #eef2f7;
  border-radius: 0 18px 18px 0;
}

.category-table td strong {
  color: #0f172a;
  font-size: 16px;
}

.description-cell {
  display: block;
  max-width: 380px;
  line-height: 1.5;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 82px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.status-pill.active {
  color: #15803d;
  background: #dcfce7;
}

.status-pill.inactive {
  color: #b91c1c;
  background: #fee2e2;
}

.actions-column {
  text-align: right;
}

.actions-cell {
  width: 1%;
  white-space: nowrap;
  text-align: right;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-left: 8px;
  border-radius: 14px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.icon-button svg {
  width: 18px;
  height: 18px;
}

.icon-button.edit {
  color: #4f46e5;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
}

.icon-button.delete {
  color: #e11d48;
  background: #fff1f2;
  border: 1px solid #fecdd3;
}

.icon-button:hover {
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.1);
  transform: translateY(-2px);
}

.state-card {
  margin: 32px;
  padding: 48px 24px;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 24px;
}

.state-card p {
  color: #64748b;
}

.state-card h2 {
  margin: 0 0 8px;
  color: #0f172a;
}

.spinner {
  width: 44px;
  height: 44px;
  margin: 0 auto 16px;
  border: 4px solid #dbeafe;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  margin: 0 auto 16px;
  color: #fff;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border-radius: 18px;
  font-size: 32px;
  font-weight: 800;
}

.secondary-action {
  min-height: 44px;
  padding: 0 18px;
  color: #fff;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border: 0;
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.22);
}

.modal-layer {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(8px);
}

.modal-panel {
  width: min(560px, 100%);
  overflow: hidden;
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.28);
  animation: modalIn 0.22s ease;
}

.modal-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 0;
}

.close-button {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.close-button:hover {
  color: #4f46e5;
  background: #eef2ff;
  transform: rotate(6deg);
}

.close-button svg {
  width: 18px;
  height: 18px;
}

form {
  padding: 24px 28px 28px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-full {
  grid-column: 1 / -1;
}

.field span {
  color: #334155;
  font-size: 14px;
  font-weight: 800;
}

input,
textarea {
  width: 100%;
  padding: 13px 14px;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #dbe3ef;
  border-radius: 16px;
  outline: 0;
  font: inherit;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

textarea {
  resize: vertical;
}

input:focus,
textarea:focus {
  background: #fff;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0 22px;
}

.switch-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch-label {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #334155;
  font-weight: 800;
  cursor: pointer;
}

.switch-track {
  display: inline-block;
  width: 52px;
  height: 30px;
  padding: 3px;
  background: #cbd5e1;
  border-radius: 999px;
  transition: background 0.2s ease;
}

.switch-thumb {
  display: block;
  width: 24px;
  height: 24px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
  transition: transform 0.2s ease;
}

.switch-input:checked + .switch-label .switch-track {
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
}

.switch-input:checked + .switch-label .switch-thumb {
  transform: translateX(22px);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #eef2f7;
}

.ghost-button,
.save-button {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 14px;
  font-weight: 800;
  cursor: pointer;
}

.ghost-button {
  color: #475569;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.ghost-button:hover {
  background: #f8fafc;
}

.save-button {
  color: #fff;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  border: 0;
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.22);
}

.save-button:hover:not(:disabled) {
  box-shadow: 0 16px 30px rgba(79, 70, 229, 0.28);
}

.save-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  vertical-align: -3px;
  animation: spin 0.7s linear infinite;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-panel,
.modal-fade-leave-active .modal-panel {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.modal-fade-enter-from .modal-panel,
.modal-fade-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 760px) {
  .page-shell {
    padding: 20px 14px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    padding: 24px;
  }

  .header-actions {
    width: 100%;
  }

  .metric-card {
    flex: 1 1 120px;
  }

  .primary-action {
    width: 100%;
  }

  .table-wrap {
    padding: 0 16px 24px;
  }

  .state-card {
    margin: 16px;
    padding: 36px 16px;
  }

  form {
    padding: 20px;
  }

  .modal-top {
    padding: 20px 20px 0;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .ghost-button,
  .save-button {
    width: 100%;
  }
}
</style>
