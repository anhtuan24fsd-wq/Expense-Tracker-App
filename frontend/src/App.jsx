import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import Dashboard from "./pages/Dashboard";
import AccountPage from "./pages/AccountPage";
import Settings from "./pages/Settings";
import Transactions from "./pages/Transactions";
import useStore from "./store";

// Component layout gốc để bảo vệ các route yêu cầu xác thực
const RootLayout = () => {
  // Sử dụng useStore để lấy thông tin user từ store
  const user = useStore((state) => state.user);
  console.log(user);
  // Nếu chưa đăng nhập (!user), chuyển hướng đến trang đăng nhập
  // Nếu đã đăng nhập, hiển thị các route con thông qua Outlet
  return !user ? (
    <Navigate to="/sign-in" />
  ) : (
    <>
      <div>
        <Outlet />
      </div>
    </>
  );
};

function App() {
  return (
    <div>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Navigate to="/overview" />} />
          <Route path="/overview" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/transactions" element={<Transactions />} />
      </Routes>
    </div>
  );
}

export default App;
