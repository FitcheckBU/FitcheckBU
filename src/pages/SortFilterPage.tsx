import { useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { IonButton, IonIcon, IonPage, IonContent } from "@ionic/react";
import { arrowBackOutline } from "ionicons/icons";
import FilterForm from "../components/FilterForm";
import { FilterState } from "../lib/inventoryService";
import Logo from "../components/Logo";
import "../styles/pages/SortFilterPage.css";

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
    <IonPage className="sort-filter-page">
      {/* Navbar matching Dashboard */}
      <div className="sort-filter-navbar">
        <Logo variant="default" onClick={() => history.push("/home")} />
      </div>

      {/* Scrollable content area */}
      <IonContent className="sort-filter-body">
        {/* Back button and title section */}
        <div className="sort-filter-header-section">
          <IonButton
            fill="clear"
            onClick={handleBack}
            className="sort-filter-back-button"
            data-testid="button-back"
          >
            <IonIcon icon={arrowBackOutline} slot="icon-only" />
          </IonButton>
          <h1 className="sort-filter-title">Sort & Filter</h1>
        </div>

        <div className="sort-filter-content">
          <div className="sort-filter-card">
            <FilterForm
              initialFilters={initialFilters}
              onApply={handleApply}
              onReset={handleReset}
            />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SortFilterPage;
