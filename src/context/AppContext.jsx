import { createContext, useContext, useReducer } from 'react';

const AppContext = createContext(null);

const initialState = {
  currentStep: 'home',
  pipelineData: null,
  complianceLevel: null,
  pipelineName: '',
  validationResults: null,
  config: {
    connectFirstParty: false,
    kpiType: 'revenue',
    adstockDecay: 'geometric',
    maxLag: 8,
    hillBeforeAdstock: false,
    knots: 'auto',
    enableAKS: true,
    priorROI: { mean: 0.0, std: 0.5 },
    externalFactors: {
      seasonality: true,
      holidays: true,
      gqv: false,
      competitorActivity: false,
      macroEconomic: false,
      weather: false,
    },
    budgetOptimization: {
      scenario: 'fixed',
      totalBudget: 10000000,
      targetROI: 1.0,
      spendConstraintLower: 0.5,
      spendConstraintUpper: 2.0,
    },
  },
  trainingStatus: 'idle',
  trainingProgress: 0,
  modelDiagnostics: null,
  dashboardData: null,
  optimizationResults: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_PIPELINE_DATA':
      return { ...state, pipelineData: action.payload };
    case 'SET_COMPLIANCE_LEVEL':
      return { ...state, complianceLevel: action.payload };
    case 'SET_PIPELINE_NAME':
      return { ...state, pipelineName: action.payload };
    case 'SET_VALIDATION_RESULTS':
      return { ...state, validationResults: action.payload };
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'UPDATE_EXTERNAL_FACTORS':
      return {
        ...state,
        config: {
          ...state.config,
          externalFactors: { ...state.config.externalFactors, ...action.payload },
        },
      };
    case 'UPDATE_BUDGET_CONFIG':
      return {
        ...state,
        config: {
          ...state.config,
          budgetOptimization: { ...state.config.budgetOptimization, ...action.payload },
        },
      };
    case 'SET_TRAINING_STATUS':
      return { ...state, trainingStatus: action.payload };
    case 'SET_TRAINING_PROGRESS':
      return { ...state, trainingProgress: action.payload };
    case 'SET_MODEL_DIAGNOSTICS':
      return { ...state, modelDiagnostics: action.payload };
    case 'SET_DASHBOARD_DATA':
      return { ...state, dashboardData: action.payload };
    case 'SET_OPTIMIZATION_RESULTS':
      return { ...state, optimizationResults: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
