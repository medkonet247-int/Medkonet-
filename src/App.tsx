import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SiteImagesProvider } from './context/SiteImagesContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProtectedRoute, AdminRoute, RepresentativeRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Join } from './pages/Join';
import { Login } from './pages/Login';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Community } from './pages/Community';
import { Resources } from './pages/Resources';
import { Mentorship } from './pages/Mentorship';
import { Events } from './pages/Events';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Media } from './pages/Media';
import { CommunityRules } from './pages/CommunityRules';
import { PrivacyNotice } from './pages/PrivacyNotice';
import { AccessDenied } from './pages/AccessDenied';
import { AdminSettings } from './pages/AdminSettings';
import { AdminMembers } from './pages/AdminMembers';
import { AdminAdmins } from './pages/AdminAdmins';
import { AdminAudit } from './pages/AdminAudit';
import { AdminSiteText } from './pages/AdminSiteText';
import { AdminContent } from './pages/AdminContent';
import { AdminUniversities } from './pages/AdminUniversities';
import { AdminReports } from './pages/AdminReports';
import { AdminRepresentatives } from './pages/AdminRepresentatives';
import { RepresentativeDashboard } from './pages/RepresentativeDashboard';
import { Directory } from './pages/Directory';
import { RepresentativesPublic } from './pages/RepresentativesPublic';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteImagesProvider>
          <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 antialiased">
            <Header />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/join" element={<Join />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/community-rules" element={<CommunityRules />} />
                <Route path="/privacy" element={<PrivacyNotice />} />
                <Route path="/access-denied" element={<AccessDenied />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
                <Route path="/mentorship" element={<ProtectedRoute><Mentorship /></ProtectedRoute>} />
                <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                <Route path="/directory" element={<ProtectedRoute><Directory /></ProtectedRoute>} />
                <Route path="/representatives" element={<ProtectedRoute><RepresentativesPublic /></ProtectedRoute>} />
                <Route path="/representative" element={<RepresentativeRoute><RepresentativeDashboard /></RepresentativeRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/media" element={<AdminRoute><Media /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                <Route path="/admin/members" element={<AdminRoute><AdminMembers /></AdminRoute>} />
                <Route path="/admin/admins" element={<AdminRoute><AdminAdmins /></AdminRoute>} />
                <Route path="/admin/audit" element={<AdminRoute><AdminAudit /></AdminRoute>} />
                <Route path="/admin/site-text" element={<AdminRoute><AdminSiteText /></AdminRoute>} />
                <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
                <Route path="/admin/universities" element={<AdminRoute><AdminUniversities /></AdminRoute>} />
                <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                <Route path="/admin/representatives" element={<AdminRoute><AdminRepresentatives /></AdminRoute>} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </SiteImagesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
