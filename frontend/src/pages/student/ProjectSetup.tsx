import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import Textarea from '../../components/common/UI/Textarea';
import { 
  PlusCircle, Users,
  Send, ShieldAlert, CheckCircle2,
  Loader2
} from 'lucide-react';

import { studentApi } from '../../services/studentApi';
import { toast } from 'react-hot-toast';

const ProjectSetup: React.FC = () => {
  const [mode, setMode] = useState<'individual' | 'group'>('individual');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batchMates, setBatchMates] = useState<{full_name: string, email: string}[]>([]);
  const [suggestions, setSuggestions] = useState<{field: string, list: any[]}>({ field: '', list: [] });
  const [allowedMode, setAllowedMode] = useState<'individual' | 'group' | 'mixed'>('mixed');
  const [maxGroupSize, setMaxGroupSize] = useState(3);
  const [isWindowOpen, setIsWindowOpen] = useState(true);
  const [members, setMembers] = useState<string[]>(['', '']);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: 'ML & Data Science',
    customDomain: '',
    githubRepo: ''
  });

  React.useEffect(() => {
    const fetchInitialData = async () => {
      try {
          const [matesRes, settingsRes, projectRes] = await Promise.all([
            studentApi.getBatchMates(),
            studentApi.getBatchSettings(),
            studentApi.getProjectDetails()
          ]);
          setBatchMates((matesRes.data as any).data || matesRes.data);
          
          const settings = (settingsRes.data as any).data || settingsRes.data;
          const currentProject = (projectRes.data as any).data;

          if (currentProject) {
            setFormData({
              title: currentProject.title,
              description: currentProject.description,
              domain: currentProject.domain || 'ML & Data Science',
              customDomain: '',
              githubRepo: currentProject.github_repo || ''
            });
            setMode(currentProject.mode.toLowerCase() as any);
            if (currentProject.members) {
              const otherMembers = currentProject.members.filter((m: any) => !m.is_leader);
              setMembers(otherMembers.map((m: any) => m.email));
            }
            // If already approved or pending, we might want to hide the form, 
            // but the user specifically asked for "editable". 
            // We'll allow it if status is 'Revision Requested' or 'Pending'.
            if (currentProject.status === 'Approved') {
              setSuccess(true);
            }
          }
        if (settings) {
          if (settings.project_type_mode) {
            const pm = settings.project_type_mode.toLowerCase();
            setAllowedMode(pm);
            if (pm === 'group') {
              setMode('group');
            } else {
              setMode('individual');
            }
          }
          if (settings.max_group_size) {
            setMaxGroupSize(settings.max_group_size);
            setMembers(Array(settings.max_group_size - 1).fill(''));
          }
          
          const now = new Date();
          let isOpen = true;
          if (settings.topic_submission_start && now < new Date(settings.topic_submission_start)) isOpen = false;
          if (settings.topic_submission_end && now > new Date(settings.topic_submission_end)) isOpen = false;
          setIsWindowOpen(isOpen);
        }
      } catch (err) {
        console.error('Fetch initial data error:', err);
      }
    };
    fetchInitialData();
  }, []);

  const handleEmailChange = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
    if (value.length > 1) {
      const filtered = batchMates.filter(m => 
        m.email.toLowerCase().includes(value.toLowerCase()) || 
        m.full_name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions({ field: `member${index}`, list: filtered.slice(0, 5) });
    } else {
      setSuggestions({ field: '', list: [] });
    }
  };

  const selectSuggestion = (index: number, email: string) => {
    const newMembers = [...members];
    newMembers[index] = email;
    setMembers(newMembers);
    setSuggestions({ field: '', list: [] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalDomain = formData.domain === 'Other' ? formData.customDomain : formData.domain;
      const memberEmails = mode === 'group' ? members.filter(e => e.trim().length > 0) : [];
      
      await studentApi.createProject({
        title: formData.title,
        description: formData.description,
        domain: finalDomain,
        mode: mode === 'individual' ? 'Individual' : 'Group',
        memberEmails
      });
      
      setSuccess(true);
      toast.success('Project proposal submitted successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initialize project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
         <h1 className="text-3xl font-black tracking-tight text-gray-800 dark:text-white">Project Initiation</h1>
         <p className="text-gray-500">Define your research scope and collaboration structure</p>
      </div>

      {!success ? (
        <div className="relative">
          {!isWindowOpen && (
            <div 
              className="absolute inset-0 z-50 cursor-not-allowed" 
              onClick={(e) => {
                e.stopPropagation();
                toast.error("Topic submission window is closed");
              }}
            />
          )}
          <form onSubmit={handleSubmit} className={`space-y-6 ${!isWindowOpen ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          <Card className="border-t-4 border-t-blue-600">
             <div className="space-y-6">
                {allowedMode === 'mixed' && (
                  <div>
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Project Operation Mode</Label>
                     <div className="grid grid-cols-2 gap-4 mt-3">
                        <button 
                          type="button"
                          onClick={() => setMode('individual')}
                          className={`p-4 rounded-2xl flex items-center gap-3 transition-all ${
                            mode === 'individual' ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-500/10' : 'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                          }`}
                        >
                           <PlusCircle size={20} />
                           <span className="font-black text-xs uppercase tracking-widest">Individual</span>
                        </button>
                        <button 
                           type="button"
                           onClick={() => setMode('group')}
                           className={`p-4 rounded-2xl flex items-center gap-3 transition-all ${
                             mode === 'group' ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-500/10' : 'bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                           }`}
                        >
                           <Users size={20} />
                           <span className="font-black text-xs uppercase tracking-widest">Group</span>
                        </button>
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <Label>Proposed Project Title</Label>
                       <Input 
                         placeholder="e.g. Intelligent Edge Gateway for IoT" 
                         className="mt-2" 
                         required 
                         value={formData.title}
                         onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                       />
                    </div>
                    <div className="space-y-4">
                       <div>
                          <Label>Technology Domain</Label>
                          <select 
                            value={formData.domain}
                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                            className="w-full mt-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                          >
                             <option>ML & Data Science</option>
                             <option>Fullstack Development</option>
                             <option>Blockchain</option>
                             <option>Cybersecurity</option>
                             <option>IoT & Embedded</option>
                             <option>Other</option>
                          </select>
                       </div>
                       {formData.domain === 'Other' && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                             <Label className="text-[10px] font-black uppercase text-blue-600">Specify Custom Domain</Label>
                             <Input 
                               className="mt-2"
                               required
                               value={formData.customDomain}
                               onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                             />
                          </div>
                       )}
                    </div>
                </div>

                {mode === 'group' && (
                  <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                     <h4 className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest mb-4">Team Formation</h4>
                       <div className="space-y-4">
                        {members.map((memberEmail, idx) => (
                         <div className="relative" key={idx}>
                            <Input 
                              placeholder={`Member ${idx + 2} Email Address`} 
                              className="h-11" 
                              value={memberEmail}
                              onChange={(e) => handleEmailChange(idx, e.target.value)}
                              onBlur={() => setTimeout(() => setSuggestions({ field: '', list: [] }), 200)}
                            />
                            {suggestions.field === `member${idx}` && suggestions.list.length > 0 && (
                               <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                                  {suggestions.list.map(m => (
                                     <button 
                                       key={m.email}
                                       type="button"
                                       onClick={() => selectSuggestion(idx, m.email)}
                                       className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex flex-col"
                                     >
                                        <span className="text-[10px] font-black uppercase text-blue-600">{m.full_name}</span>
                                        <span className="text-xs font-medium text-gray-500">{m.email}</span>
                                     </button>
                                  ))}
                               </div>
                            )}
                         </div>
                        ))}
                         <p className="text-[10px] text-gray-400 font-bold italic">* You will automatically be assigned as the Group Leader. Leave unused member fields empty.</p>
                      </div>
                  </div>
                )}

                 <div>
                    <Label>Project Description / Abstract</Label>
                    <Textarea 
                      placeholder="Clearly define the problem statement, objectives, and proposed technical architecture..." 
                      className="mt-2 h-40 text-sm leading-relaxed"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                 </div>

                <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl">
                   <ShieldAlert size={20} className="text-orange-500 flex-shrink-0" />
                   <div className="text-[10px] font-bold text-gray-500 leading-relaxed">
                      IMPORTANT: Project initiation is a one-time process for the semester. Ensure all team details and abstracts are verified before submission.
                   </div>
                </div>

                 <button 
                   type="submit"
                   disabled={loading}
                   className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    {loading ? 'INITIALIZING...' : 'INITIALIZE PROJECT ENTITY'}
                 </button>
             </div>
          </Card>
        </form>
        </div>
      ) : (
        <Card className="text-center py-20 px-8">
           <div className="inline-flex p-5 bg-green-50 rounded-full text-green-500 mb-6">
              <CheckCircle2 size={48} />
           </div>
           <h2 className="text-2xl font-black">Project Successfully Initiated</h2>
           <p className="text-gray-500 mt-3 max-w-sm mx-auto">
             Your proposal has been sent to the Department for manual verification. You can track your approval status on the Topic Status page.
           </p>
           <button 
            onClick={() => setSuccess(false)}
            className="mt-8 px-8 py-3 bg-gray-50 rounded-xl text-xs font-black hover:bg-gray-100 transition-all"
           >
              EDIT INITIAL DATA
           </button>
        </Card>
      )}
    </div>
  );
};

export default ProjectSetup;
