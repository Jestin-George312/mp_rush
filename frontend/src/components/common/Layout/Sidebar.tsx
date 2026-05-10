import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  FileCheck,
  UserPlus,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Users,
  MessageSquare,
  Video,
  Calendar,
  User,
  Settings,
  LogOut,
  MoreVertical,
  GraduationCap,
  Activity,
  CheckCircle,
  Github,
  Upload,
  Trello as TrelloIcon,
  Library,
  Hourglass
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { studentApi } from '../../../services/studentApi';
import * as coordApi from '../../../services/coordinatorApi';
import type { StudentStats } from '../../../services/studentApi';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  badge?: string;
  alert?: boolean;
}

interface NavLinkItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  alert?: boolean;
}

interface NavSection {
  label: string;
  links: NavLinkItem[];
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, collapsed, badge, alert }) => (
  <Link
    to={to}
    className={`flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all ${isActive
      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-100 shadow-sm'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    title={collapsed ? label : undefined}
  >
    <div className="flex items-center gap-3">
      {icon}
      {!collapsed && <span>{label}</span>}
    </div>
    {!collapsed && (
      <div className="flex items-center gap-2">
        {badge && (
          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {badge}
          </span>
        )}
        {alert && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
        )}
      </div>
    )}
  </Link>
);

// Define all navigation links by role
const STUDENT_NAV: NavSection[] = [
  {
    label: 'Initiation',
    links: [
      { to: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/student/setup', label: 'Project Setup', icon: <PlusCircle size={18} /> },
      { to: '/student/topic-status', label: 'Topic Status', icon: <FileCheck size={18} /> },
    ]
  },
  {
    label: 'Execution',
    links: [
      { to: '/student/repository', label: 'Repository', icon: <Github size={18} /> },
      { to: '/student/tasks', label: 'Kanban Board', icon: <TrelloIcon size={18} /> },
      { to: '/student/team', label: 'Team', icon: <Users size={18} /> },
      { to: '/student/progress', label: 'Progress', icon: <Activity size={18} /> },
    ]
  },
  {
    label: 'Deliverables',
    links: [
      { to: '/student/deadlines', label: 'Deadlines', icon: <Calendar size={18} /> },
      { to: '/student/submissions', label: 'Submissions', icon: <Upload size={18} /> },
      { to: '/student/feedback', label: 'Feedback', icon: <MessageSquare size={18} />, alert: true },
      { to: '/student/archive', label: 'Doc Archive', icon: <FolderOpen size={18} /> },
    ]
  },
  {
    label: 'Communication',
    links: [
      { to: '/student/chat', label: 'Messages', icon: <MessageSquare size={18} /> },
      { to: '/student/meetings', label: 'Meetings', icon: <Video size={18} /> },
    ]
  }
];

const GUIDE_NAV: NavSection[] = [
  {
    label: 'Supervision Hub',
    links: [
      { to: '/guide/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/guide/topics', label: 'Topic Approvals', icon: <FileCheck size={18} /> },
      { to: '/guide/batches', label: 'Assigned Batches', icon: <Library size={18} /> },
    ]
  },
  {
    label: 'Progress & Review',
    links: [
      { to: '/guide/groups', label: 'Project Groups', icon: <Users size={18} /> },
      { to: '/guide/documents', label: 'Document Review', icon: <ClipboardList size={18} /> },
      { to: '/guide/kanban', label: 'Kanban Oversight', icon: <TrelloIcon size={18} /> },
    ]
  },
  {
    label: 'Project Insights',
    links: [
      { to: '/guide/git-activity', label: 'Commit Activity', icon: <Activity size={18} /> },
      { to: '/guide/compliance', label: 'Compliance Tracker', icon: <CheckCircle size={18} />, alert: true },
      { to: '/guide/extensions', label: 'Extensions', icon: <Hourglass size={18} /> },
    ]
  },
  {
    label: 'Communication',
    links: [
      { to: '/guide/chat', label: 'Messages', icon: <MessageSquare size={18} /> },
      // { to: '/guide/meetings', label: 'Schedule', icon: <Calendar size={18} /> },
    ]
  }
];

const COORDINATOR_NAV: NavSection[] = [
  { 
    label: 'Overview', 
    links: [
      { to: '/coordinator/dashboard', label: 'Department Dashboard', icon: <LayoutDashboard size={18} /> }
    ]
  },
  {
    label: 'Departmental Workspace',
    links: [
      { to: '/coordinator/faculty', label: 'Faculty Hub', icon: <GraduationCap size={18} /> },
      { to: '/coordinator/batches', label: 'Departmental Batches', icon: <Library size={18} /> },
      { to: '/coordinator/students', label: 'Student Roster', icon: <Users size={18} /> },
      { to: '/coordinator/assignment', label: 'Guide Assignment', icon: <UserPlus size={18} /> },
    ]
  },
  {
    label: 'Progress Monitoring',
    links: [
      { to: '/coordinator/projects', label: 'Project Groups', icon: <FolderOpen size={18} /> },
      { to: '/coordinator/deadlines', label: 'Departmental Deadlines', icon: <Calendar size={18} /> },
      { to: '/coordinator/submissions', label: 'Submissions', icon: <ClipboardList size={18} /> },
      { to: '/coordinator/topics', label: 'Topic Approvals', icon: <CheckCircle size={18} /> },
    ]
  },
  {
    label: 'Audit & Health',
    links: [
      { to: '/coordinator/health', label: 'Project Health', icon: <Activity size={18} />, alert: true },
      { to: '/coordinator/rubrics', label: 'Evaluation Rubrics', icon: <ClipboardList size={18} /> },
    ]
  }
];

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
];

// Role labels for display
const ROLE_LABELS: Record<string, string> = {
  student: 'Student Portal',
  guide: 'Guide Portal',
  coordinator: 'Coordinator Portal',
  admin: 'Admin Portal',
};

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [coordinatorUnassigned, setCoordinatorUnassigned] = useState(false);

  useEffect(() => {
    if (user?.role?.toLowerCase() === 'student') {
        const fetchStats = async () => {
            try {
                const res = await studentApi.getDashboardStats();
                setStats((res.data as any).data || res.data);
            } catch (err) {
                console.error('Sidebar stats fetch error:', err);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 60000); // Refresh every minute
        return () => clearInterval(interval);
    } else if (user?.role?.toLowerCase() === 'coordinator') {
        const fetchCoordStats = async () => {
            try {
                const res = await coordApi.getDeptStats();
                if (res.data?.success && res.data.data.isUnassigned) {
                    setCoordinatorUnassigned(true);
                } else {
                    setCoordinatorUnassigned(false);
                }
            } catch (err) {
                console.error('Sidebar coord stats fetch error:', err);
            }
        };
        fetchCoordStats();
    }
  }, [user]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine the active role based on URL path OR user role
  const activeRole = useMemo(() => {
    const path = location.pathname;

    // First, check URL path to determine context
    if (path.startsWith('/student')) return 'student';
    if (path.startsWith('/guide')) return 'guide';
    if (path.startsWith('/coordinator')) return 'coordinator';
    if (path.startsWith('/admin')) return 'admin';

    // Fall back to user's assigned role
    return user?.role?.toLowerCase() || 'student';
  }, [location.pathname, user?.role]);

  // Get role label for header
  const roleLabel = ROLE_LABELS[activeRole] || 'APMS';

  const dynamicStudentNav = useMemo(() => {
    if (activeRole !== 'student' || !stats) return STUDENT_NAV;
    
    return STUDENT_NAV.map(section => ({
        ...section,
        links: section.links.map(link => {
            if (link.label === 'Repository') return { ...link, alert: !stats.hasRepo && stats.hasProject };
            if (link.label === 'Team') return { ...link, badge: stats.memberCount > 0 ? String(stats.memberCount) : undefined };
            if (link.label === 'Progress') return { ...link, badge: stats.progress > 0 ? `${stats.progress}%` : undefined };
            if (link.label === 'Deadlines') return { ...link, badge: stats.pendingDeadlinesCount > 0 ? String(stats.pendingDeadlinesCount) : undefined };
            if (link.label === 'Feedback') return { ...link, badge: stats.unreadFeedbackCount > 0 ? String(stats.unreadFeedbackCount) : undefined, alert: stats.unreadFeedbackCount > 0 };
            if (link.label === 'Messages') return { ...link, badge: stats.unreadMessages > 0 ? String(stats.unreadMessages) : undefined };
            if (link.label === 'Project Setup' && stats.pendingInvitationsCount > 0) return { ...link, badge: String(stats.pendingInvitationsCount), alert: true };
            return link;
        })
    }));
  }, [activeRole, stats]);

  const handleEditProfile = () => {
    setShowProfileMenu(false);
    navigate(`/${activeRole}/profile`);
  };

  const handleSettings = () => {
    setShowProfileMenu(false);
    navigate(`/${activeRole}/settings`);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
  };

  return (
    <aside
      className={`${collapsed ? 'w-16 shadow-none' : 'w-64 shadow-2xl shadow-gray-200 dark:shadow-none'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col z-30`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-700">
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter text-blue-600 dark:text-blue-500">APMS</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{roleLabel}</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto custom-scrollbar">
        {(activeRole === 'coordinator' && coordinatorUnassigned) ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-50">
                <LayoutDashboard size={32} className="text-gray-400 mb-2" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Access Restricted</p>
                <p className="text-[10px] text-gray-400 mt-1">You are not assigned to a department.</p>
            </div>
        ) : (activeRole === 'coordinator' || activeRole === 'guide' || activeRole === 'student') ? (
          (activeRole === 'coordinator' ? COORDINATOR_NAV : activeRole === 'guide' ? GUIDE_NAV : dynamicStudentNav).map((section) => (
            <div key={section.label} className="space-y-1">
              {!collapsed && (
                <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                  {section.label}
                </p>
              )}
              {section.links.map(link => (
                <NavItem
                  key={link.to}
                  to={link.to}
                  icon={link.icon}
                  label={link.label}
                  isActive={location.pathname === link.to || location.pathname.startsWith(link.to + '/')}
                  collapsed={collapsed}
                  badge={link.badge}
                  alert={link.alert}
                />
              ))}
            </div>
          ))
        ) : (
          ADMIN_LINKS.map(link => (
            <NavItem
              key={link.to}
              to={link.to}
              icon={link.icon}
              label={link.label}
              isActive={location.pathname === link.to || location.pathname.startsWith(link.to + '/')}
              collapsed={collapsed}
            />
          ))
        )}
      </nav>

      {/* User Info with Dropdown */}
      {user && (
        <div ref={profileMenuRef} className="relative p-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all ${collapsed ? 'justify-center' : ''
              }`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={user.picture || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`}
                alt={user.name}
                className="w-10 h-10 rounded-xl object-cover shadow-sm ring-2 ring-white dark:ring-gray-800"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="text-sm font-black truncate text-gray-700 dark:text-gray-200">{user.name}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-blue-600 dark:text-blue-400">
                      {user.role}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                    <span className="text-[9px] font-bold text-gray-400">ID: 4122</span>
                  </div>
                </div>
                <MoreVertical size={16} className="text-gray-400 flex-shrink-0" />
              </>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className={`absolute ${collapsed ? 'left-16' : 'left-3 right-3'} bottom-full mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden`}>
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <img
                    src={user.picture || `https://ui-avatars.com/api/?name=${user.name}`}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="overflow-hidden">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleEditProfile}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <User size={18} className="text-gray-500" />
                  <span className="text-sm">Edit Profile</span>
                </button>
                <button
                  onClick={handleSettings}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <Settings size={18} className="text-gray-500" />
                  <span className="text-sm">Settings</span>
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
