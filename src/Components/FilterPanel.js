import React, { useEffect, useMemo, useState } from 'react';
import './FilterPanel.css';
import { normalizeBoolean, normalizeCuisineList } from '../utils/restaurantUtils';

const quickFilterConfigs = [
  {
    id: 'vegetarian',
    label: 'Vegetariano',
    predicate: (restaurant) =>
      normalizeBoolean(restaurant.vegetariano ?? restaurant.menuVegetariano)
  },
  {
    id: 'domicilios',
    label: 'Domicilios',
    predicate: (restaurant) =>
      normalizeBoolean(restaurant.domicilios ?? restaurant.domicilio)
  },
  {
    id: 'descuentos',
    label: 'Descuentos / tiquetera',
    predicate: (restaurant) =>
      normalizeBoolean(
        restaurant.tiquetera ?? restaurant.ticketera ?? restaurant.descuento
      )
  }
];

const defaultQuickFilters = quickFilterConfigs.reduce(
  (acc, filter) => ({ ...acc, [filter.id]: false }),
  {}
);

const FilterPanel = ({
  restaurants,
  setFilteredRestaurants,
  isMobileOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilters, setQuickFilters] = useState(defaultQuickFilters);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = useMemo(() => {
    const categorySet = new Set();
    restaurants.forEach((restaurant) => {
      normalizeCuisineList(restaurant.tipoComida).forEach((category) => {
        categorySet.add(category);
      });
    });
    return Array.from(categorySet).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }, [restaurants]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants, searchTerm, quickFilters, selectedCategory]);

  const applyFilters = () => {
    let filtered = restaurants;

    quickFilterConfigs.forEach((filter) => {
      if (quickFilters[filter.id]) {
        filtered = filtered.filter(filter.predicate);
      }
    });

    if (selectedCategory) {
      filtered = filtered.filter((restaurant) =>
        normalizeCuisineList(restaurant.tipoComida).some(
          (category) =>
            category.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((restaurant) =>
        [restaurant.nombre, restaurant.direccion, restaurant.descripcion]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(query))
      );
    }

    setFilteredRestaurants(filtered);
  };

  const toggleQuickFilter = (id) => {
    setQuickFilters((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory((prev) => (prev === category ? '' : category));
  };

  const handleReset = () => {
    setQuickFilters(defaultQuickFilters);
    setSelectedCategory('');
    setSearchTerm('');
    setFilteredRestaurants(restaurants);
    onClose?.();
  };

  return (
    <>
      <aside
        className={`filter-panel ${
          isMobileOpen ? 'filter-panel--open' : ''
        }`}
      >
        <div className="filter-panel__header">
          <div>
            <h2 className="filter-panel__title">Explora</h2>
            <p className="filter-panel__subtitle">
              Refina los resultados para encontrar tu lugar ideal.
            </p>
          </div>
          <button
            className="filter-panel__close"
            onClick={() => onClose?.()}
            aria-label="Cerrar panel de filtros"
          >
            &times;
          </button>
        </div>

        <div className="filter-panel__section">
          <label className="filter-panel__label" htmlFor="filter-search">
            Buscar
          </label>
          <input
            id="filter-search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nombre o dirección"
            className="filter-panel__input"
          />
        </div>

        <div className="filter-panel__section">
          <span className="filter-panel__label">Filtros rápidos</span>
          <div className="filter-panel__quick-list">
            {quickFilterConfigs.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`filter-panel__chip ${
                  quickFilters[filter.id] ? 'is-active' : ''
                }`}
                onClick={() => toggleQuickFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-panel__section">
          <div className="filter-panel__section-heading">
            <span className="filter-panel__label">Tipo de comida</span>
            {selectedCategory && (
              <button
                type="button"
                className="filter-panel__clear"
                onClick={() => setSelectedCategory('')}
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="filter-panel__chip-grid">
            {categories.length === 0 ? (
              <p className="filter-panel__empty">
                Aún no hay categorías registradas.
              </p>
            ) : (
              categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`filter-panel__chip ${
                    selectedCategory === category ? 'is-active' : ''
                  }`}
                  onClick={() => handleCategoryClick(category)}
                >
                  {category}
                </button>
              ))
            )}
          </div>
        </div>

        <button
          type="button"
          className="filter-panel__reset"
          onClick={handleReset}
        >
          Borrar filtros
        </button>
      </aside>

      <div
        className={`filter-panel__backdrop ${
          isMobileOpen ? 'filter-panel__backdrop--visible' : ''
        }`}
        onClick={() => onClose?.()}
        role="presentation"
      />
    </>
  );
};

export default FilterPanel;
