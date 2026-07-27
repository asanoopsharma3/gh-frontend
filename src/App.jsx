import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './component/Header';
import Home from './pages/Home';
import Support from './pages/Support';
import StartPlay from './auth/startPlay';
import Question from './quiz/Question';
import './App.css';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import ProtectedAdminRoute from "./admin/ProtectedAdminRoute";
import AdminLoginPage from "./admin/AdminLoginPage";
import AdminLayout from "./admin/AdminLayout";
import DashboardPage from "./admin/DashboardPage";
import AddQuizPage from "./admin/AddQuizPage";
import QuizListPage from "./admin/QuizListPage";
import Leaderboard from './component/Leaderboard';
import Product from './pages/Product';
import Contextprovider from './context/contextprovider';
import CustomerCare from './component/CustomerCarepage/CustomerCare';
import Searchnumber from './component/SearchNumber/Searchnumber';
import Fetchalluser from './admin/Fetchalluser';
import MtntransactionUI from './component/mtntransaction/Mtntransaction.jsx';
import MTNRenewalHistory from './admin/MTNRenewalHistory.jsx';
import MTNUnsubscribeHistory from "./admin/MTNUnsubscribeHistory.jsx";
import ProtectedCustomerRoute from "./auth/ProtectedCustomerRoute";
import Userprofile from './component/useprofile/Userprofile.jsx';
import Subscribe from './pages/Subscribe.jsx';
import ActivationCallback from './pages/ActivationCallback.jsx';
import Topup from './component/topup/Topup.jsx';



// ---------------- Home Redirect ----------------
const HomeRedirect = () => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isLoggedIn) {
    return <Navigate to="/start/play" replace />;
  }
  return <Home />;
};

// ---------------- Auth Redirect ----------------
const AuthRedirect = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// ---------------- Layout Component ----------------
function Layout() {
  const location = useLocation();

  const hideHeaderRoutes = [
    '/login',
    '/register',
    '/purchase/plan',
  ];

  const shouldHideHeader =
    hideHeaderRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/admin");

  return (
    <main>
      <div className="container-fluid m-0 p-0">
        {!shouldHideHeader && <Header />}
      </div>

      <div className="container-fluid m-0 p-0">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/support" element={<Support />} />
          <Route path="/product" element={<Product />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/activation/callback" element={<ActivationCallback />} />
          <Route path='/topup' element={<ProtectedRoute><Topup /></ProtectedRoute>} />
           <Route path='/user-profile' element={<ProtectedRoute><Userprofile/></ProtectedRoute>}/>
         {/* ✅ Customer Care Routes */}
          <Route path="/customercare" element={<CustomerCare />} />
          <Route
            path="/searchnumber"
            element={
              <ProtectedCustomerRoute>
                <Searchnumber />
              </ProtectedCustomerRoute>
            }
          />



          <Route path="/allusers" element={<Fetchalluser />} />

          {/* Auth Routes */}
          <Route path="/otp/login" element={<Navigate to="/subscribe?fallback=true" replace />} />
          <Route path="/otp/verify" element={<Navigate to="/subscribe?fallback=true" replace />} />
          <Route path="/login" element={<Navigate to="/subscribe?fallback=true" replace />} />
          <Route path="/register" element={<Navigate to="/subscribe?fallback=true" replace />} />

          {/* Protected User Routes */}
          <Route path="/start/play" element={<ProtectedRoute><StartPlay /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><Question /></ProtectedRoute>} />
          <Route path="/purchase/plan" element={<Subscribe />} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<ProtectedAdminRoute><DashboardPage /></ProtectedAdminRoute>} />
            <Route path="subscribers" element={<ProtectedAdminRoute><DashboardPage defaultReport="success" /></ProtectedAdminRoute>} />
            <Route path="renewal-subscribers" element={<ProtectedAdminRoute><DashboardPage defaultReport="renewal" /></ProtectedAdminRoute>} />
            <Route path="churn-subscribers" element={<ProtectedAdminRoute><DashboardPage defaultReport="churn" /></ProtectedAdminRoute>} />
            <Route path="add-quiz" element={<ProtectedAdminRoute><AddQuizPage /></ProtectedAdminRoute>} />
            <Route path="quizzes" element={<ProtectedAdminRoute><QuizListPage /></ProtectedAdminRoute>} />
            <Route path="mtnstatus" element={<ProtectedAdminRoute><MtntransactionUI /></ProtectedAdminRoute>} />

          <Route 
  path="mtn-renewals" 
  element={<MTNRenewalHistory />} 
/>

<Route
  path="mtn-unsubscribe"
  element={
    <ProtectedAdminRoute>
      <MTNUnsubscribeHistory />
    </ProtectedAdminRoute>
  }
/>


            {/* ✅ Fixed: checkmomostatus is now inside /admin */}
             <Route path="allusers" element={<ProtectedAdminRoute><Fetchalluser /></ProtectedAdminRoute>} />
          </Route>
        </Routes>
      </div>
    </main>
  );
}

// ---------------- Main App Component ----------------
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Contextprovider>
          <Layout />
        </Contextprovider>
      </AuthProvider>
    </BrowserRouter>
  );
}
