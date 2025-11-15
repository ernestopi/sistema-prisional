import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  /* ========= GERAIS ========= */
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 15,
  },

  /* ========= CABEÃ‡ALHO (usado em vÃ¡rias telas) ========= */
  header: { 
    backgroundColor: '#1e3a8a', 
    padding: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 25, 
    fontWeight: 'bold', 
    marginTop: 20 
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
    marginLeft: 12,
    color: "#1e3a8a",
  },

  /* ========= BOTÃ•ES DO CABEÃ‡ALHO ========= */
  logoutBtn: { 
    backgroundColor: '#ef4444', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    marginTop: 25, 
    borderRadius: 10 
  },
    logoutBtnList: { 
    backgroundColor: '#797575ff', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    marginTop: 25, 
    borderRadius: 10 
  },
  logoutText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  backText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },

  /* ========= LOGIN ========= */
  loginContainer: {
    flex: 1,
    backgroundColor: "#1e3a8a",
    justifyContent: "center",
  },
  loginKeyboard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a8a",
    textAlign: "center",
    marginBottom: 8,
  },
  loginSubtitle: {
    textAlign: "center",
    color: "#475569",
    marginBottom: 20,
  },
  loginInput: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: "#1e3a8a",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginInfo: {
    marginTop: 20,
  },
  loginInfoTitle: {
    fontWeight: "bold",
    color: "#334155",
  },
  loginInfoText: {
    color: "#475569",
  },

  /* ========= MENU PRINCIPAL ========= */
  menuContainer: { 
    flex: 1, 
    backgroundColor: '#f3f4f6' 
  },
  menuContent: { 
    flex: 1, 
    padding: 20 
  },
  menuCard: { 
    backgroundColor: '#e0e0e07a', 
    borderRadius: 10, 
    padding: 20, 
    marginBottom: 10, 
    alignItems: 'center' 
  },
  menuIcon: { 
    fontSize: 30, 
    marginBottom: 10 
  },
  menuCardTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1f2937' 
  },
  menuCardDescription: {
    color: "#475569",
    textAlign: "center",
    marginTop: 5,
  },
  totalBox: { 
    backgroundColor: '#2563eb', 
    borderRadius: 10, 
    marginTop: 5, 
    alignItems: 'center',
    padding: 10
  },
  totalText: { 
    color: '#ece7e7ff', 
    fontSize: 32, 
    fontWeight: 'bold' 
  },

  /* ========= MENU ANTIGO (manter compatibilidade) ========= */
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuHeaderTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center"
  },
  menuHeaderSubtitle: {
    color: "#cbd5e1",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1e3a8a",
  },

  /* ========= CONFERÃŠNCIA ========= */
  cellCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cellHeader: {
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 6,
  },
  cellTitle: {
    fontWeight: "bold",
    color: "#1e3a8a",
    fontSize: 16,
    marginTop: 10,
    marginLeft: 12,
  },
  prisonerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  prisonerText: {
    flex: 1,
    color: "#1e293b",
  },
  prisonerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    color: "#2563eb",
    fontWeight: "600",
  },
  deleteButton: {
    color: "#dc2626",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#1e3a8a",
    margin: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#94a3b8",
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  /* ========= MODAL ========= */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: "#1e3a8a",
    padding: 10,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#e2e8f0",
    padding: 10,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#1e3a8a",
    fontWeight: "600",
  },

  /* ========= LISTA ========= */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#475569",
  },

  /* ========= HISTÃ“RICO ========= */
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  historyTitle: {
    fontWeight: "bold",
    color: "#1e3a8a",
  },
  historyDate: {
    color: "#475569",
  },

  /* ========= CONFERÊNCIA - ABAS ========= */
  tabs: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    maxHeight: 90,
  },
  tab: { 
    paddingHorizontal: 20, 
    paddingVertical: 5, 
    alignItems: "center" 
    
  },
  tabActive: {
    borderBottomWidth: 5,
    borderBottomColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  tabText: { 
    fontSize: 15, 
    color: "#6b7280", 
    fontWeight: "600" 
  },
  tabCount: { 
    fontSize: 15, 
    color: "#9ca3af", 
    fontWeight: "bold" 
  },

  /* ========= CONFERÊNCIA - CARDS E PRESOS ========= */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  addBtn: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
  },
  photo: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 10 
  },
  photoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  prisonerInfo: { 
    flex: 1 
  },
  prisonerName: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#1f2937" 
  },
  prisonerDetail: { 
    fontSize: 12, 
    color: "#6b7280", 
    marginTop: 2 
  },
  badges: {
    flexDirection: "row",
    marginTop: 5,
    gap: 5,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "#e9d5ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: { 
    fontSize: 10, 
    fontWeight: "bold" 
  },
  actions: { 
    flexDirection: "row" 
  },
  editBtn: {
    backgroundColor: "#f59e0b",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  delBtn: {
    backgroundColor: "#ef4444",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  delText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },

  /* ========= CONFERÊNCIA - CELAS ========= */
  cellCardNew: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cellHeaderNew: {
    backgroundColor: "#1d4ed8",
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cellTitleNew: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "bold" 
  },
  cellCount: { 
    color: "#fff", 
    fontSize: 12, 
    fontWeight: "bold" 
  },
  addPrisonerBtn: {
    backgroundColor: "#2563eb",
    margin: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addPrisonerText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },

  /* ========= CONFERÊNCIA - MODAL COMPLETO ========= */
  modal: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    maxHeight: "90%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  photoBtn: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  photoBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 15,
  },
  checkboxes: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 12,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkBoxActive: { 
    backgroundColor: "#2563eb", 
    borderColor: "#2563eb" 
  },
  checkmark: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 10 
  },
  checkLabel: { 
    fontSize: 14, 
    color: "#1f2937" 
  },
  modalBtns: { 
    flexDirection: "row", 
    gap: 10 
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#6b7280",
    alignItems: "center",
  },
  saveBtn2: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#16a34a",
    alignItems: "center",
  },
  btnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },

  /* ========= LISTA E BUSCA ========= */
  searchArea: { 
    backgroundColor: "#fff", 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: "#e5e7eb" 
  },
  searchBtns: { 
    flexDirection: "row", 
    gap: 8, 
    marginBottom: 10 
  },
  searchBtn: { 
    flex: 1, 
    paddingVertical: 8, 
    borderRadius: 8, 
    backgroundColor: "#f3f4f6", 
    alignItems: "center" 
  },
  searchBtnActive: { 
    backgroundColor: "#2563eb" 
  },
  searchBtnText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: "#6b7280" 
  },
  searchInput: { 
    borderWidth: 1, 
    borderColor: "#d1d5db", 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16, 
    backgroundColor: "#f9fafb" 
  },
  confBtns: { 
    flexDirection: "row", 
    gap: 10, 
    marginTop: 12 
  },
  confBtn: { 
    flex: 1, 
    backgroundColor: "#16a34a", 
    padding: 12, 
    borderRadius: 8, 
    alignItems: "center" 
  },
  confBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },
  saveBtn: { 
    backgroundColor: "#2563eb", 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    justifyContent: "center" 
  },
  saveBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },
  printBtn: { 
    backgroundColor: "#7c3aed", 
    padding: 12, 
    borderRadius: 8, 
    alignItems: "center", 
    marginTop: 12 
  },
  printBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },
  listCard: { 
    backgroundColor: "#fff", 
    borderRadius: 10, 
    marginBottom: 10, 
    padding: 12, 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#e5e7eb" 
  },
  checkbox: { 
    width: 30, 
    height: 30, 
    borderWidth: 2, 
    borderColor: "#d1d5db", 
    borderRadius: 6, 
    marginRight: 10, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  checkboxActive: { 
    backgroundColor: "#16a34a", 
    borderColor: "#16a34a" 
  },
  location: { 
    fontSize: 12, 
    color: "#2563eb", 
    fontWeight: "bold", 
    marginTop: 4, 
    backgroundColor: "#eff6ff", 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 5, 
    alignSelf: "flex-start" 
  },
  headerSub: { 
    color: "#cfcfcfce", 
    fontSize: 20 
  },

  
});

export default styles;