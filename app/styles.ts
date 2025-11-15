import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  /* ========= GERAIS ========= */
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
  },

  /* ========= CABEÇALHO FINO E MINIMALISTA ========= */
  header: { 
    backgroundColor: "#1e40af",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#4043f3ff',
  },
  
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  
  headerCenter: {
    flex: 3,
    alignItems: 'center',
  },
  
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: '600',
    letterSpacing: 0.3,
    flexWrap: 'nowrap', // Adicionei
    numberOfLines: 1, // Adicionei
  },
  headerSub: { 
    color: '#999', 
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 15,
    marginLeft: 5,
    color: "#1e40af",
  },

  /* ========= BOTÕES DO CABEÇALHO MINIMALISTAS ========= */
  logoutBtn: { 
    backgroundColor: '#ef4444', // Adicionei fundo vermelho
    paddingHorizontal: 16, // Aumentei de 8 para 16
    paddingVertical: 8, // Aumentei de 6 para 8
    borderRadius: 8, // Aumentei de 6 para 8
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutBtnList: { 
    backgroundColor: 'transparent',
    paddingHorizontal: 8, 
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: { 
    color: '#fff', // Mudei de '#999' para branco
    fontWeight: '600', // Aumentei de '500' para '600'
    fontSize: 14,
  },
  backText: { 
    color: '#fff', // Mudei de '#999' para branco
    fontWeight: '600', // Aumentei de '500' para '600'
    fontSize: 14,
  },
  circleBackButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: '#334155', // azul escuro/cinza escuro
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 5,
},


  /* ========= LOGIN ========= */
  loginContainer: {
    flex: 1,
    backgroundColor: "#1e40af",
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
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1e40af",
    textAlign: "center",
    marginBottom: 8,
  },
  loginSubtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: 24,
    fontSize: 15,
  },
  loginInput: {
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: "#f8fafc",
  },
  loginButton: {
    backgroundColor: "#1e40af",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
    color: "#64748b",
  },

  /* ========= MENU PRINCIPAL ========= */
  menuContainer: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  menuContent: { 
    flex: 1, 
    padding: 20 
  },
  menuCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 24, 
    marginBottom: 16, 
    alignItems: 'center',
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  menuIcon: { 
    fontSize: 36, 
    marginBottom: 12 
  },
  menuCardTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1e293b',
    marginBottom: 8,
  },
  menuCardDescription: {
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
    fontSize: 14,
  },
  totalBox: { 
    backgroundColor: '#1e40af', 
    borderRadius: 16, 
    marginTop: 10, 
    alignItems: 'center',
    padding: 20,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  totalText: { 
    color: '#fff', 
    fontSize: 32, 
    fontWeight: 'bold' 
  },

  /* ========= MENU ANTIGO (manter compatibilidade) ========= */
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e40af",
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
    color: "#bfdbfe",
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
    color: "#1e40af",
  },

  /* ========= CONFERÊNCIA - MODERNIZADO ========= */
  cellCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 5,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cellHeader: {
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 8,
    fontSize: 15,
  },
  cellTitle: {
    fontWeight: "bold",
    color: "#1e40af",
    fontSize: 16,
    marginTop: 10,
    marginLeft: 12,
  },
  prisonerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
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
    color: "#3b82f6",
    fontWeight: "600",
  },
  deleteButton: {
    color: "#ef4444",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#1e40af",
    margin: 1,
    marginTop: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#64748b",
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  /* ========= MODAL ========= */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: "#f8fafc",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  saveButton: {
    backgroundColor: "#1e40af",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 15,
  },

  /* ========= LISTA ========= */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 15,
  },

  /* ========= HISTÓRICO - MODERNIZADO ========= */
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  historyTitle: {
    fontWeight: "bold",
    color: "#1e40af",
    fontSize: 16,
    marginBottom: 8,
  },
  historyDate: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 4,
  },

  /* ========= CONFERÊNCIA - ABAS MODERNIZADAS ========= */
  tabs: {
  backgroundColor: "#ffffff",
  paddingVertical: 12,
  paddingHorizontal: 8,
  borderBottomWidth: 1,
  borderBottomColor: "#e5e7eb",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 3,
},

tab: { 
  paddingHorizontal: 20,
  paddingVertical: 12,
  marginHorizontal: 6,
  borderRadius: 12,
  minWidth: 90,
  alignItems: "center",
  backgroundColor: "#f8fafc",
  borderWidth: 1,
  borderColor: "#e2e8f0",
},

tabActive: {
  backgroundColor: "#3b82f6",
  borderColor: "#3b82f6",
  shadowColor: "#3b82f6",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
},

tabText: { 
  fontSize: 15,
  color: "#64748b",
  fontWeight: "600",
  letterSpacing: 0.3,
},

tabCount: { 
  fontSize: 12,
  color: "#94a3b8",
  fontWeight: "600",
  marginTop: 4,
},

  /* ========= CONFERÊNCIA - CARDS E PRESOS MODERNIZADOS ========= */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 5,
  },
  addBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 14,
  },
  card: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  photo: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#cbd5e1",
  },
  prisonerInfo: { 
    flex: 1 
  },
  prisonerName: { 
    fontSize: 17, 
    fontWeight: "bold", 
    color: "#1e293b",
    marginBottom: 4,
  },
  prisonerDetail: { 
    fontSize: 13, 
    color: "#64748b", 
    marginTop: 3 
  },
  badges: {
    flexDirection: "row",
    marginTop: 8,
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "#ddd6fe",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: "bold" 
  },
  actions: { 
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#f59e0b",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  delBtn: {
    backgroundColor: "#ef4444",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  delText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },

  /* ========= CONFERÊNCIA - CELAS MODERNIZADAS ========= */
  cellCardNew: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cellHeaderNew: {
    backgroundColor: "#3b82f6",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cellTitleNew: { 
    color: "#fff", 
    fontSize: 19, 
    fontWeight: "bold" 
  },
  cellCount: { 
    color: "#fff", 
    fontSize: 13, 
    fontWeight: "bold",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addPrisonerBtn: {
    backgroundColor: "#3b82f6",
    margin: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#60a5fa",
    borderStyle: "dashed",
  },
  addPrisonerText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },

  /* ========= CONFERÊNCIA - MODAL COMPLETO MODERNIZADO ========= */
  modal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    maxHeight: "90%",
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: "#f8fafc",
  },
  photoBtn: {
    backgroundColor: "#8b5cf6",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  photoBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#e2e8f0",
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
    marginBottom: 14,
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
  },
  checkBox: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkBoxActive: { 
    backgroundColor: "#3b82f6", 
    borderColor: "#3b82f6" 
  },
  checkmark: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 14 
  },
  checkLabel: { 
    fontSize: 14, 
    color: "#1e293b",
    fontWeight: "500",
  },
  modalBtns: { 
    flexDirection: "row", 
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  saveBtn2: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#10b981",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 15 
  },

  /* ========= LISTA E BUSCA MODERNIZADOS ========= */
  searchArea: { 
    backgroundColor: "#fff", 
    padding: 18, 
    borderBottomWidth: 1, 
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchBtns: { 
    flexDirection: "row", 
    gap: 10, 
    marginBottom: 14 
  },
  searchBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 10, 
    backgroundColor: "#f1f5f9", 
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchBtnActive: { 
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  searchBtnText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: "#64748b" 
  },
  searchInput: { 
    borderWidth: 1.5, 
    borderColor: "#cbd5e1", 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 15, 
    backgroundColor: "#f8fafc" 
  },
  confBtns: { 
    flexDirection: "row", 
    gap: 12, 
    marginTop: 14 
  },
  confBtn: { 
    flex: 1, 
    backgroundColor: "#10b981", 
    padding: 14, 
    borderRadius: 12, 
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 14 
  },
  saveBtn: { 
    backgroundColor: "#3b82f6", 
    paddingHorizontal: 24, 
    borderRadius: 12, 
    justifyContent: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 14 
  },
  printBtn: { 
    backgroundColor: "#8b5cf6", 
    padding: 14, 
    borderRadius: 12, 
    alignItems: "center", 
    marginTop: 5,
    marginBottom: 10,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  printBtnText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 14 
  },
  listCard: { 
    backgroundColor: "#fff", 
    borderRadius: 14, 
    marginBottom: 12, 
    padding: 16, 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#e2e8f0",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: { 
    width: 32, 
    height: 32, 
    borderWidth: 2, 
    borderColor: "#cbd5e1", 
    borderRadius: 8, 
    marginRight: 12, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: { 
    backgroundColor: "#10b981", 
    borderColor: "#10b981" 
  },
  location: { 
    fontSize: 12, 
    color: "#3b82f6", 
    fontWeight: "bold", 
    marginTop: 6, 
    backgroundColor: "#eff6ff", 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    alignSelf: "flex-start",
    overflow: "hidden",
  },
});

export default styles;