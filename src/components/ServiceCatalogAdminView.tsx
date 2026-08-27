import React, { useState, useMemo } from 'react';
import {
  CategoryMaster,
  ServiceMaster,
  ApplicationAssetMaster,
  IssueTypeMaster,
  ApplicationModuleMaster,
  ApplicationSubFunctionMaster,
  ApplicationProcessMaster,
  UserProfile,
  TicketCategory,
  PriorityLevel,
} from '../types';
import {
  MASTER_CATEGORIES,
  MASTER_SERVICES,
  MASTER_APPLICATIONS_ASSETS,
  MASTER_ISSUE_TYPES,
  MASTER_APPLICATION_MODULES,
  MASTER_APPLICATION_SUBFUNCTIONS,
  MASTER_APPLICATION_PROCESSES,
} from '../data/serviceCatalog';
import {
  FolderTree,
  Server,
  Layers,
  Tag,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Laptop,
  Network,
  Printer,
  Shield,
  HelpCircle,
  FileCode,
  Sparkles,
  RotateCcw,
  Save,
  ArrowRight,
  ChevronRight,
  Database,
  Sliders,
} from 'lucide-react';

interface ServiceCatalogAdminViewProps {
  currentUser: UserProfile;
  categories?: CategoryMaster[];
  onUpdateCategories?: (cats: CategoryMaster[]) => void;
  services?: ServiceMaster[];
  onUpdateServices?: (srvs: ServiceMaster[]) => void;
  applications?: ApplicationAssetMaster[];
  onUpdateApplications?: (apps: ApplicationAssetMaster[]) => void;
  issueTypes?: IssueTypeMaster[];
  onUpdateIssueTypes?: (types: IssueTypeMaster[]) => void;
  modules?: ApplicationModuleMaster[];
  onUpdateModules?: (mods: ApplicationModuleMaster[]) => void;
  subFunctions?: ApplicationSubFunctionMaster[];
  onUpdateSubFunctions?: (sfs: ApplicationSubFunctionMaster[]) => void;
  processes?: ApplicationProcessMaster[];
  onUpdateProcesses?: (procs: ApplicationProcessMaster[]) => void;
}

export const ServiceCatalogAdminView: React.FC<ServiceCatalogAdminViewProps> = ({
  currentUser,
  categories: propCategories,
  onUpdateCategories,
  services: propServices,
  onUpdateServices,
  applications: propApplications,
  onUpdateApplications,
  issueTypes: propIssueTypes,
  onUpdateIssueTypes,
  modules: propModules,
  onUpdateModules,
  subFunctions: propSubFunctions,
  onUpdateSubFunctions,
  processes: propProcesses,
  onUpdateProcesses,
}) => {
  // Master state with prop or default initial data
  const [categories, setCategories] = useState<CategoryMaster[]>(
    propCategories || MASTER_CATEGORIES
  );
  const [services, setServices] = useState<ServiceMaster[]>(
    propServices || MASTER_SERVICES
  );
  const [applications, setApplications] = useState<ApplicationAssetMaster[]>(
    propApplications || MASTER_APPLICATIONS_ASSETS
  );
  const [issueTypes, setIssueTypes] = useState<IssueTypeMaster[]>(
    propIssueTypes || MASTER_ISSUE_TYPES
  );
  const [modules, setModules] = useState<ApplicationModuleMaster[]>(
    propModules || MASTER_APPLICATION_MODULES
  );
  const [subFunctions, setSubFunctions] = useState<ApplicationSubFunctionMaster[]>(
    propSubFunctions || MASTER_APPLICATION_SUBFUNCTIONS
  );
  const [processes, setProcesses] = useState<ApplicationProcessMaster[]>(
    propProcesses || MASTER_APPLICATION_PROCESSES
  );

  const [activeCatalogTab, setActiveCatalogTab] = useState<
    'categories' | 'services' | 'applications' | 'issuetypes' | 'appareas' | 'matrix'
  >('categories');

  const [searchTerm, setSearchTerm] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // --------------------------------------------------------------------------
  // Modals and Editing States
  // --------------------------------------------------------------------------
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [catNameInput, setCatNameInput] = useState('');
  const [catCodeInput, setCatCodeInput] = useState('');
  const [catDescInput, setCatDescInput] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [srvNameInput, setSrvNameInput] = useState('');
  const [srvCodeInput, setSrvCodeInput] = useState('');
  const [srvCatIdInput, setSrvCatIdInput] = useState(categories[0]?.id || 'cat-biz-apps');
  const [srvDescInput, setSrvDescInput] = useState('');
  const [showServiceModal, setShowServiceModal] = useState(false);

  const [editAppId, setEditAppId] = useState<string | null>(null);
  const [appNameInput, setAppNameInput] = useState('');
  const [appCodeInput, setAppCodeInput] = useState('');
  const [appSrvIdInput, setAppSrvIdInput] = useState(services[0]?.id || 'srv-biz-prod');
  const [appAssetTagInput, setAppAssetTagInput] = useState('');
  const [appHasAreaInput, setAppHasAreaInput] = useState(true);
  const [appDescInput, setAppDescInput] = useState('');
  const [showAppModal, setShowAppModal] = useState(false);

  const [editIssueTypeId, setEditIssueTypeId] = useState<string | null>(null);
  const [issueNameInput, setIssueNameInput] = useState('');
  const [issueCodeInput, setIssueCodeInput] = useState('');
  const [issueDescInput, setIssueDescInput] = useState('');
  const [issuePriorityInput, setIssuePriorityInput] = useState<PriorityLevel>('Medium');
  const [issueBadgeColorInput, setIssueBadgeColorInput] = useState('bg-rose-50 text-rose-700 border-rose-200');
  const [issueIsActiveInput, setIssueIsActiveInput] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Application Area 3-Tier Hierarchy Explorer
  const [selectedHierarchyAppId, setSelectedHierarchyAppId] = useState<string>(
    applications.find((a) => a.hasApplicationArea)?.id || 'app-pcs-net'
  );
  const [selectedHierarchyModuleId, setSelectedHierarchyModuleId] = useState<string>(
    modules[0]?.id || 'mod-pcs-107'
  );
  const [selectedHierarchySubFnId, setSelectedHierarchySubFnId] = useState<string>(
    subFunctions[0]?.id || 'sf-pcs-cd2'
  );

  // Filtered Lists
  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const cat = categories.find((c) => c.id === s.categoryId);
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat && cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [services, categories, searchTerm]);

  const filteredApplications = useMemo(() => {
    return applications.filter((a) => {
      const srv = services.find((s) => s.id === a.serviceId);
      const cat = srv ? categories.find((c) => c.id === srv.categoryId) : null;
      return (
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.assetTag && a.assetTag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (srv && srv.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cat && cat.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [applications, services, categories, searchTerm]);

  const filteredIssueTypes = useMemo(() => {
    return issueTypes.filter(
      (it) =>
        it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.defaultPriority.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [issueTypes, searchTerm]);

  // --------------------------------------------------------------------------
  // Category Actions
  // --------------------------------------------------------------------------
  const handleSaveCategory = () => {
    if (!catNameInput.trim()) return;
    let updated: CategoryMaster[];
    if (editCategoryId) {
      updated = categories.map((c) =>
        c.id === editCategoryId
          ? {
              ...c,
              name: catNameInput.trim(),
              code: catCodeInput.trim().toUpperCase() || c.code,
              description: catDescInput.trim(),
            }
          : c
      );
      showToast(`Category "${catNameInput}" updated successfully.`);
    } else {
      const newCat: CategoryMaster = {
        id: `cat-${Date.now().toString().slice(-6)}`,
        name: catNameInput.trim(),
        code: catCodeInput.trim().toUpperCase() || `CAT_${Date.now().toString().slice(-4)}`,
        description: catDescInput.trim(),
        isActive: true,
        displayOrder: categories.length + 1,
      };
      updated = [...categories, newCat];
      showToast(`New category "${catNameInput}" created.`);
    }
    setCategories(updated);
    if (onUpdateCategories) onUpdateCategories(updated);
    setShowCategoryModal(false);
  };

  const handleToggleCategoryActive = (id: string) => {
    const updated = categories.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    setCategories(updated);
    if (onUpdateCategories) onUpdateCategories(updated);
    showToast('Category status updated.');
  };

  // --------------------------------------------------------------------------
  // Service Actions
  // --------------------------------------------------------------------------
  const handleSaveService = () => {
    if (!srvNameInput.trim()) return;
    let updated: ServiceMaster[];
    if (editServiceId) {
      updated = services.map((s) =>
        s.id === editServiceId
          ? {
              ...s,
              name: srvNameInput.trim(),
              code: srvCodeInput.trim().toUpperCase() || s.code,
              categoryId: srvCatIdInput,
              description: srvDescInput.trim(),
            }
          : s
      );
      showToast(`Service "${srvNameInput}" updated successfully.`);
    } else {
      const selectedCategory = categories.find((c) => c.id === srvCatIdInput);
      const newSrv: ServiceMaster = {
        id: `srv-${Date.now().toString().slice(-6)}`,
        name: srvNameInput.trim(),
        code: srvCodeInput.trim().toUpperCase() || `SRV_${Date.now().toString().slice(-4)}`,
        categoryId: srvCatIdInput,
        categoryName: (selectedCategory?.name || 'Business Applications') as TicketCategory,
        isAssetBased: selectedCategory ? selectedCategory.name === 'Hardware' || selectedCategory.name === 'Printer & Scanning' : false,
        description: srvDescInput.trim(),
        isActive: true,
        displayOrder: services.length + 1,
      };
      updated = [...services, newSrv];
      showToast(`New service "${srvNameInput}" created.`);
    }
    setServices(updated);
    if (onUpdateServices) onUpdateServices(updated);
    setShowServiceModal(false);
  };

  const handleToggleServiceActive = (id: string) => {
    const updated = services.map((s) =>
      s.id === id ? { ...s, isActive: !s.isActive } : s
    );
    setServices(updated);
    if (onUpdateServices) onUpdateServices(updated);
    showToast('Service status updated.');
  };

  // --------------------------------------------------------------------------
  // Application Actions
  // --------------------------------------------------------------------------
  const handleSaveApp = () => {
    if (!appNameInput.trim()) return;
    let updated: ApplicationAssetMaster[];
    const selectedService = services.find((s) => s.id === appSrvIdInput);
    if (editAppId) {
      updated = applications.map((a) =>
        a.id === editAppId
          ? {
              ...a,
              name: appNameInput.trim(),
              code: appCodeInput.trim().toUpperCase() || a.code,
              serviceId: appSrvIdInput,
              serviceName: selectedService ? selectedService.name : a.serviceName,
              categoryId: selectedService ? selectedService.categoryId : a.categoryId,
              assetTag: appAssetTagInput.trim() || undefined,
              hasApplicationArea: appHasAreaInput,
              description: appDescInput.trim(),
            }
          : a
      );
      showToast(`Application/Asset "${appNameInput}" updated.`);
    } else {
      const newApp: ApplicationAssetMaster = {
        id: `app-${Date.now().toString().slice(-6)}`,
        name: appNameInput.trim(),
        code: appCodeInput.trim().toUpperCase() || `APP_${Date.now().toString().slice(-4)}`,
        serviceId: appSrvIdInput,
        serviceName: selectedService ? selectedService.name : 'Unknown Service',
        categoryId: selectedService ? selectedService.categoryId : 'cat-biz-apps',
        type: 'Application',
        assetTag: appAssetTagInput.trim() || undefined,
        hasApplicationArea: appHasAreaInput,
        description: appDescInput.trim(),
        isActive: true,
      };
      updated = [...applications, newApp];
      showToast(`New Application/Asset "${appNameInput}" created.`);
    }
    setApplications(updated);
    if (onUpdateApplications) onUpdateApplications(updated);
    setShowAppModal(false);
  };

  const handleToggleAppActive = (id: string) => {
    const updated = applications.map((a) =>
      a.id === id ? { ...a, isActive: !a.isActive } : a
    );
    setApplications(updated);
    if (onUpdateApplications) onUpdateApplications(updated);
    showToast('Application status updated.');
  };

  // --------------------------------------------------------------------------
  // Issue Type Actions
  // --------------------------------------------------------------------------
  const handleSaveIssueType = () => {
    if (!issueNameInput.trim()) return;
    let updated: IssueTypeMaster[];
    if (editIssueTypeId) {
      updated = issueTypes.map((it) =>
        it.id === editIssueTypeId
          ? {
              ...it,
              name: issueNameInput.trim(),
              code: issueCodeInput.trim().toUpperCase() || it.code,
              description: issueDescInput.trim(),
              badgeColor: issueBadgeColorInput,
              defaultPriority: issuePriorityInput,
              isActive: issueIsActiveInput,
            }
          : it
      );
      showToast(`Issue Type "${issueNameInput}" updated.`);
    } else {
      const newIssueType: IssueTypeMaster = {
        id: `issue-${Date.now().toString().slice(-6)}`,
        name: issueNameInput.trim(),
        code: issueCodeInput.trim().toUpperCase() || `ISSUE_${Date.now().toString().slice(-4)}`,
        description: issueDescInput.trim(),
        badgeColor: issueBadgeColorInput,
        defaultPriority: issuePriorityInput,
        isActive: issueIsActiveInput,
        displayOrder: issueTypes.length + 1,
      };
      updated = [...issueTypes, newIssueType];
      showToast(`New Issue Type "${issueNameInput}" created.`);
    }
    setIssueTypes(updated);
    if (onUpdateIssueTypes) onUpdateIssueTypes(updated);
    setShowIssueModal(false);
  };

  const handleToggleIssueTypeActive = (id: string) => {
    const updated = issueTypes.map((it) =>
      it.id === id ? { ...it, isActive: !it.isActive } : it
    );
    setIssueTypes(updated);
    if (onUpdateIssueTypes) onUpdateIssueTypes(updated);
    showToast('Issue Type status updated.');
  };

  const handleDeleteIssueType = (id: string) => {
    const target = issueTypes.find((it) => it.id === id);
    if (window.confirm(`Are you sure you want to remove Issue Type "${target?.name || id}"?`)) {
      const updated = issueTypes.filter((it) => it.id !== id);
      setIssueTypes(updated);
      if (onUpdateIssueTypes) onUpdateIssueTypes(updated);
      showToast(`Issue Type "${target?.name || id}" removed.`);
    }
  };

  // --------------------------------------------------------------------------
  // Reset All to Default Master Data
  // --------------------------------------------------------------------------
  const handleResetToDefaults = () => {
    if (window.confirm('Reset all IT Service Catalog master data to enterprise default standards?')) {
      setCategories(MASTER_CATEGORIES);
      setServices(MASTER_SERVICES);
      setApplications(MASTER_APPLICATIONS_ASSETS);
      setIssueTypes(MASTER_ISSUE_TYPES);
      setModules(MASTER_APPLICATION_MODULES);
      setSubFunctions(MASTER_APPLICATION_SUBFUNCTIONS);
      setProcesses(MASTER_APPLICATION_PROCESSES);

      if (onUpdateCategories) onUpdateCategories(MASTER_CATEGORIES);
      if (onUpdateServices) onUpdateServices(MASTER_SERVICES);
      if (onUpdateApplications) onUpdateApplications(MASTER_APPLICATIONS_ASSETS);
      if (onUpdateIssueTypes) onUpdateIssueTypes(MASTER_ISSUE_TYPES);
      if (onUpdateModules) onUpdateModules(MASTER_APPLICATION_MODULES);
      if (onUpdateSubFunctions) onUpdateSubFunctions(MASTER_APPLICATION_SUBFUNCTIONS);
      if (onUpdateProcesses) onUpdateProcesses(MASTER_APPLICATION_PROCESSES);

      showToast('Master Catalog reset to defaults.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <FolderTree className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                IT Service Catalog & Classification Administration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized master data tables for Category ➔ Service ➔ Application/Asset ➔ Issue Type & Application Areas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleResetToDefaults}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <button
          onClick={() => setActiveCatalogTab('categories')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeCatalogTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>1. Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveCatalogTab('services')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeCatalogTab === 'services'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>2. Services ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveCatalogTab('applications')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeCatalogTab === 'applications'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>3. Applications & Assets ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveCatalogTab('issuetypes')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeCatalogTab === 'issuetypes'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>4. Issue Types ({issueTypes.length})</span>
        </button>

        <button
          onClick={() => setActiveCatalogTab('appareas')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeCatalogTab === 'appareas'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>5. Application Areas (Modules/Functions)</span>
        </button>

        <button
          onClick={() => setActiveCatalogTab('matrix')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
            activeCatalogTab === 'matrix'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Hierarchy Tree Map</span>
        </button>
      </div>

      {/* Global Search Bar */}
      {activeCatalogTab !== 'matrix' && activeCatalogTab !== 'appareas' && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeCatalogTab}...`}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 shadow-2xs"
            />
          </div>

          <div>
            {activeCatalogTab === 'categories' && (
              <button
                onClick={() => {
                  setEditCategoryId(null);
                  setCatNameInput('');
                  setCatCodeInput('');
                  setCatDescInput('');
                  setShowCategoryModal(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            )}

            {activeCatalogTab === 'services' && (
              <button
                onClick={() => {
                  setEditServiceId(null);
                  setSrvNameInput('');
                  setSrvCodeInput('');
                  setSrvCatIdInput(categories[0]?.id || '');
                  setSrvDescInput('');
                  setShowServiceModal(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service</span>
              </button>
            )}

            {activeCatalogTab === 'applications' && (
              <button
                onClick={() => {
                  setEditAppId(null);
                  setAppNameInput('');
                  setAppCodeInput('');
                  setAppSrvIdInput(services[0]?.id || '');
                  setAppAssetTagInput('');
                  setAppHasAreaInput(true);
                  setAppDescInput('');
                  setShowAppModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Application / Asset</span>
              </button>
            )}

            {activeCatalogTab === 'issuetypes' && (
              <button
                onClick={() => {
                  setEditIssueTypeId(null);
                  setIssueNameInput('');
                  setIssueCodeInput('');
                  setIssueDescInput('');
                  setIssuePriorityInput('Medium');
                  setIssueBadgeColorInput('bg-rose-50 text-rose-700 border-rose-200');
                  setIssueIsActiveInput(true);
                  setShowIssueModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Issue Type</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 1: CATEGORIES TABLE */}
      {/* ==================================================================== */}
      {activeCatalogTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Linked Services</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCategories.map((cat) => {
                  const linkedSrvCount = services.filter((s) => s.categoryId === cat.id).length;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{cat.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{cat.name}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-md">{cat.description}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full border border-blue-200 text-[11px]">
                          {linkedSrvCount} Services
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleCategoryActive(cat.id)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            cat.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {cat.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditCategoryId(cat.id);
                            setCatNameInput(cat.name);
                            setCatCodeInput(cat.code);
                            setCatDescInput(cat.description);
                            setShowCategoryModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: SERVICES TABLE */}
      {/* ==================================================================== */}
      {activeCatalogTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Parent Category</th>
                  <th className="py-3 px-4">Service Code</th>
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Applications / Assets</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredServices.map((srv) => {
                  const parentCat = categories.find((c) => c.id === srv.categoryId);
                  const linkedAppCount = applications.filter((a) => a.serviceId === srv.id).length;
                  return (
                    <tr key={srv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded border border-slate-200 text-[11px]">
                          {parentCat?.name || srv.categoryId}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">{srv.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{srv.name}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-md">{srv.description}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200 text-[11px]">
                          {linkedAppCount} Items
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleServiceActive(srv.id)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            srv.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {srv.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditServiceId(srv.id);
                            setSrvNameInput(srv.name);
                            setSrvCodeInput(srv.code);
                            setSrvCatIdInput(srv.categoryId);
                            setSrvDescInput(srv.description || '');
                            setShowServiceModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: APPLICATIONS & ASSETS TABLE */}
      {/* ==================================================================== */}
      {activeCatalogTab === 'applications' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Service & Category</th>
                  <th className="py-3 px-4">Application / Asset Name</th>
                  <th className="py-3 px-4">Asset Tag / Code</th>
                  <th className="py-3 px-4 text-center">Has Application Area?</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredApplications.map((app) => {
                  const parentSrv = services.find((s) => s.id === app.serviceId);
                  const parentCat = parentSrv
                    ? categories.find((c) => c.id === parentSrv.categoryId)
                    : null;
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{parentSrv?.name}</span>
                          <span className="text-[10px] text-slate-400">{parentCat?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-950">{app.name}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">
                        {app.assetTag ? (
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                            {app.assetTag}
                          </span>
                        ) : (
                          <span className="text-slate-400">{app.code}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {app.hasApplicationArea ? (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold text-[10px] inline-flex items-center space-x-1">
                            <Check className="w-3 h-3 text-indigo-600" />
                            <span>Modules Enabled</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-400 border border-slate-200 rounded text-[10px]">
                            N/A (Direct Ticket)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleAppActive(app.id)}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            app.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {app.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditAppId(app.id);
                            setAppNameInput(app.name);
                            setAppCodeInput(app.code);
                            setAppSrvIdInput(app.serviceId);
                            setAppAssetTagInput(app.assetTag || '');
                            setAppHasAreaInput(!!app.hasApplicationArea);
                            setAppDescInput(app.description || '');
                            setShowAppModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-semibold">Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: ISSUE TYPES TABLE */}
      {/* ==================================================================== */}
      {activeCatalogTab === 'issuetypes' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Issue Type</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Default Priority</th>
                  <th className="py-3 px-4">Badge Styling</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredIssueTypes.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{it.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{it.code}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-md">{it.description}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          it.defaultPriority === 'Critical'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : it.defaultPriority === 'High'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : it.defaultPriority === 'Medium'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {it.defaultPriority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${it.badgeColor}`}>
                        {it.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleIssueTypeActive(it.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border cursor-pointer transition-colors ${
                          it.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {it.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => {
                            setEditIssueTypeId(it.id);
                            setIssueNameInput(it.name);
                            setIssueCodeInput(it.code);
                            setIssueDescInput(it.description);
                            setIssuePriorityInput(it.defaultPriority);
                            setIssueBadgeColorInput(it.badgeColor);
                            setIssueIsActiveInput(it.isActive);
                            setShowIssueModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Issue Type"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteIssueType(it.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Issue Type"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: APPLICATION AREAS (MODULES ➔ SUB-FUNCTIONS ➔ PROCESSES) */}
      {/* ==================================================================== */}
      {activeCatalogTab === 'appareas' && (
        <div className="space-y-6">
          <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-300" />
                <h3 className="text-base font-bold">Application Area Technical Matrix Configurator</h3>
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                Configure hierarchical 3-tier mapping (Module ➔ Sub-Function ➔ Process) for Tanaka Business Applications.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-indigo-800/80 px-3 py-1.5 rounded-xl border border-indigo-700 text-indigo-200">
                {modules.length} Modules • {subFunctions.length} Sub-Functions • {processes.length} Processes
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Modules */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span className="p-1 bg-blue-100 text-blue-700 rounded font-mono text-[10px]">1</span>
                  <span>Target Modules ({modules.length})</span>
                </span>
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {modules.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedHierarchyModuleId(m.id)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      selectedHierarchyModuleId === m.id
                        ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">{m.name}</span>
                      <span className="text-[10px] text-slate-400 block">{m.description}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Sub-Functions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span className="p-1 bg-indigo-100 text-indigo-700 rounded font-mono text-[10px]">2</span>
                  <span>Sub-Functions</span>
                </span>
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {subFunctions
                  .filter((sf) => sf.moduleId === selectedHierarchyModuleId)
                  .map((sf) => (
                    <div
                      key={sf.id}
                      onClick={() => setSelectedHierarchySubFnId(sf.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        selectedHierarchySubFnId === sf.id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{sf.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>
                  ))}

                {subFunctions.filter((sf) => sf.moduleId === selectedHierarchyModuleId).length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    No sub-functions defined for this module yet.
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Processes / Functions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span className="p-1 bg-emerald-100 text-emerald-700 rounded font-mono text-[10px]">3</span>
                  <span>Processes / Functions</span>
                </span>
              </div>

              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {processes
                  .filter((p) => p.subFunctionId === selectedHierarchySubFnId)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-between shadow-2xs"
                    >
                      <span>{p.name}</span>
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    </div>
                  ))}

                {processes.filter((p) => p.subFunctionId === selectedHierarchySubFnId).length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    Select a sub-function with configured processes.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: HIERARCHY TREE MAP */}
      {/* ==================================================================== */}
      {activeCatalogTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Relational IT Helpdesk Classification Tree
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Visual overview of all active Categories, dependent Services, and associated Application Assets.
            </p>
          </div>

          <div className="space-y-6">
            {categories.map((cat) => {
              const catServices = services.filter((s) => s.categoryId === cat.id && s.isActive);
              return (
                <div
                  key={cat.id}
                  className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4.5 space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-blue-600 text-white rounded-lg font-bold text-[10px]">
                      {cat.code}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                    <span className="text-[11px] text-slate-400">({cat.description})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-4 border-l-2 border-blue-300 ml-3">
                    {catServices.map((srv) => {
                      const srvApps = applications.filter(
                        (a) => a.serviceId === srv.id && a.isActive
                      );
                      return (
                        <div
                          key={srv.id}
                          className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-blue-900">{srv.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{srv.code}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                            {srvApps.map((app) => (
                              <span
                                key={app.id}
                                className={`text-[10px] px-2 py-0.5 rounded border ${
                                  app.hasApplicationArea
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200 font-bold'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 font-semibold'
                                }`}
                              >
                                {app.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* ==================================================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editCategoryId ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="e.g. Business Applications"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Code</label>
                <input
                  type="text"
                  value={catCodeInput}
                  onChange={(e) => setCatCodeInput(e.target.value)}
                  placeholder="e.g. CAT_BIZ_APPS"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDescInput}
                  onChange={(e) => setCatDescInput(e.target.value)}
                  placeholder="Brief description of this classification category..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT SERVICE */}
      {/* ==================================================================== */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editServiceId ? 'Edit Service' : 'Create New Service'}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Parent Category *</label>
                <select
                  value={srvCatIdInput}
                  onChange={(e) => setSrvCatIdInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Name *</label>
                <input
                  type="text"
                  value={srvNameInput}
                  onChange={(e) => setSrvNameInput(e.target.value)}
                  placeholder="e.g. Production System or Laptop"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Code</label>
                <input
                  type="text"
                  value={srvCodeInput}
                  onChange={(e) => setSrvCodeInput(e.target.value)}
                  placeholder="e.g. SRV_PROD_SYS"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={srvDescInput}
                  onChange={(e) => setSrvDescInput(e.target.value)}
                  placeholder="Brief description of this service tier..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowServiceModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveService}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                Save Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT APPLICATION OR ASSET */}
      {/* ==================================================================== */}
      {showAppModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editAppId ? 'Edit Application / Asset' : 'Create New Application / Asset'}
              </h3>
              <button
                onClick={() => setShowAppModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Parent Service *</label>
                <select
                  value={appSrvIdInput}
                  onChange={(e) => setAppSrvIdInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                  {services.map((s) => {
                    const c = categories.find((cat) => cat.id === s.categoryId);
                    return (
                      <option key={s.id} value={s.id}>
                        [{c?.name || 'Category'}] → {s.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Application / Asset Name *
                </label>
                <input
                  type="text"
                  value={appNameInput}
                  onChange={(e) => setAppNameInput(e.target.value)}
                  placeholder="e.g. PCS.NET or Dell Latitude 5440"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={appCodeInput}
                    onChange={(e) => setAppCodeInput(e.target.value)}
                    placeholder="e.g. APP_PCS_NET"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asset Tag</label>
                  <input
                    type="text"
                    value={appAssetTagInput}
                    onChange={(e) => setAppAssetTagInput(e.target.value)}
                    placeholder="e.g. HW-LAPTOP-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chkHasArea"
                  checked={appHasAreaInput}
                  onChange={(e) => setAppHasAreaInput(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="chkHasArea" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Enable Application Area (Modules / Sub-Functions)
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={appDescInput}
                  onChange={(e) => setAppDescInput(e.target.value)}
                  placeholder="Brief description or technical stack..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAppModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApp}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                Save Application / Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD / EDIT ISSUE TYPE */}
      {/* ==================================================================== */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editIssueTypeId ? 'Edit Issue Type' : 'Add New Issue Type'}
              </h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Issue Type Name *
                </label>
                <input
                  type="text"
                  value={issueNameInput}
                  onChange={(e) => setIssueNameInput(e.target.value)}
                  placeholder="e.g. Incident, Service Request, Hardware Fault..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={issueCodeInput}
                    onChange={(e) => setIssueCodeInput(e.target.value)}
                    placeholder="e.g. INCIDENT"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Default Priority
                  </label>
                  <select
                    value={issuePriorityInput}
                    onChange={(e) => setIssuePriorityInput(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Badge Color Preset
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[
                    { label: 'Rose / Red', class: 'bg-rose-50 text-rose-700 border-rose-200' },
                    { label: 'Blue', class: 'bg-blue-50 text-blue-700 border-blue-200' },
                    { label: 'Emerald', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { label: 'Amber', class: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { label: 'Purple', class: 'bg-purple-50 text-purple-700 border-purple-200' },
                    { label: 'Indigo', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                    { label: 'Cyan', class: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                    { label: 'Slate', class: 'bg-slate-100 text-slate-700 border-slate-200' },
                  ].map((preset) => (
                    <button
                      key={preset.class}
                      type="button"
                      onClick={() => setIssueBadgeColorInput(preset.class)}
                      className={`p-1.5 rounded-lg border text-[11px] font-bold truncate transition-all cursor-pointer ${
                        preset.class
                      } ${
                        issueBadgeColorInput === preset.class
                          ? 'ring-2 ring-blue-500 shadow-xs'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium">Preview:</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${issueBadgeColorInput}`}>
                    {issueNameInput || 'Preview Issue Type'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={issueDescInput}
                  onChange={(e) => setIssueDescInput(e.target.value)}
                  placeholder="Brief description of this issue classification..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chkIssueActive"
                  checked={issueIsActiveInput}
                  onChange={(e) => setIssueIsActiveInput(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
                <label htmlFor="chkIssueActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Active in Ticket Classification Dropdowns
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowIssueModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveIssueType}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                Save Issue Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
