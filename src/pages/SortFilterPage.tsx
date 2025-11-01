import { useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonButton, IonIcon } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import FilterForm from "../components/FilterForm";
import { FilterState } from "../lib/inventoryService";
import "./SortFilterPage.css";

type SortFilterRouteState = {
  activeFilters?: FilterState;
};

const emptyFilters: FilterState = {
  categories: [],
  brands: [],
  colors: [],
  sizes: [],
  conditions: [],
  priceMin: undefined,
  priceMax: undefined,
  decades: [],
  styles: [],
  soldStatus: "all",
  sortBy: { field: "dateAdded", direction: "desc" },
};

const SortFilterPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<SortFilterRouteState>();

  const initialFilters = useMemo(() => {
    return location.state?.activeFilters ?? emptyFilters;
  }, [location.state]);

  const handleApply = (filters: FilterState) => {
    history.replace("/home", { appliedFilters: filters });
  };

  const handleReset = () => {
    history.replace("/home", { resetFilters: true });
  };

  const handleBack = () => {
    history.goBack();
  };

  return (
    <div className="sort-filter-container">
      <div className="sort-filter-header">
        <IonButton
          fill="clear"
          onClick={handleBack}
          className="sort-filter-back-button"
        >
          <IonIcon icon={arrowBackOutline} slot="icon-only" />
        </IonButton>
        <h2 className="sort-filter-title">Sort & Filter</h2>
      </div>
      <div className="sort-filter-card">
        <FilterForm
          initialFilters={initialFilters}
          onApply={handleApply}
          onReset={handleReset}
        />
      </div>
    </div>
  );
};

export default SortFilterPage;
