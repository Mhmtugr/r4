import { ref, computed } from 'vue';

export function useOrderFilters() {
  const filterOptions = ref({
    search: '',
    status: '',
    dateRange: 'all',
    startDate: null,
    endDate: null
  });

  const sortConfig = ref({
    key: 'createdAt',
    direction: 'desc'
  });

  const isFiltered = computed(() => {
    return (
      filterOptions.value.search !== '' ||
      filterOptions.value.status !== '' ||
      filterOptions.value.dateRange !== 'all'
    );
  });

  function resetFilters() {
    filterOptions.value = { search: '', status: '', dateRange: 'all', startDate: null, endDate: null };
  }

  function sortBy(key) {
    if (sortConfig.value.key === key) {
      sortConfig.value.direction = sortConfig.value.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sortConfig.value.key = key;
      sortConfig.value.direction = 'asc';
    }
  }

  return { filterOptions, sortConfig, isFiltered, resetFilters, sortBy };
}
