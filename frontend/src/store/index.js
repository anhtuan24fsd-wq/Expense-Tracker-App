import { create } from "zustand";

const useStore = create((set) => ({
  // Lấy theme từ localStorage, mặc định là "light" nếu chưa có
  theme: localStorage.getItem("theme") ?? "light",
  // Lấy thông tin user từ localStorage, mặc định là null nếu chưa có
  user: JSON.parse(localStorage.getItem("user")) ?? null,
  // Hàm cập nhật theme
  setTheme: (value) => set({ theme: value }),
  // Hàm lưu thông tin đăng nhập của user
  setCredentials: (user) => set({ user }),
  // Hàm đăng xuất, xóa thông tin user
  signOut: () => set({ user: null }),
}));

export default useStore;
