import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/UI/Card';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import Textarea from '../../components/common/UI/Textarea';
import Button from '../../components/common/UI/Button';
import { 
  Send, Info, Users, 
  Lightbulb, ShieldCheck, AlertTriangle, Loader2,
  Lock, CheckCircle2
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';
import { toast } from 'react-hot-toast';

const TopicSubmission: React.FC = () => {
  const navigate = useNavigate();
  const [batchSettings, setBatchSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: 'Web & Mobile Engineering',
    mode: 'individual',
    memberEmails: ['', '']
  });

  useEffect(() => {
    const fetchBatchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await studentApi.getBatchSettings();
        if (res.data) {
          setBatchSettings(res.data.data);
          // Auto-set mode if batch enforces it
          if (res.data.data.project_type_mode === 'individual') {
            setFormData(prev => ({ ...prev, mode: 'individual' }));
          } else if (res.data.data.project_type_mode === 'group') {
            setFormData(prev => ({ ...prev, mode: 'group' }));
          }
        }
      } catch (error) {
        console.error('Fetch batch settings error', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await studentApi.createProject({
        title: formData.title,
        description: formData.description,
        mode: formData.mode === 'group' ? 'Group' : 'Individual',
        memberEmails: formData.mode === 'group' ? formData.memberEmails.filter(e => e.trim() !== '') : []
      });
      setSuccess(true);
      toast.success('Proposal submitted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWindowOpen = () => {
    if (!batchSettings) return false;
    const now = new Date();
    const start = batchSettings.topic_submission_start ? new Date(batchSettings.topic_submission_start) : null;
    const end = batchSettings.topic_submission_end ? new Date(batchSettings.topic_submission_end) : null;
    
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Verifying Submission Window...</p>
      </div>
    );
  }

  if (!isWindowOpen() && !success) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="inline-flex p-6 bg-orange-50 dark:bg-orange-900/20 rounded-full text-orange-600 mb-4">
          <Lock size={64} />
        </div>
        <h2 className="text-3xl font-black text-gray-800 dark:text-white">Submission Window Closed</h2>
        <p className="text-gray-500">
          The topic submission portal for your batch is currently locked. 
          {batchSettings?.topic_submission_start && new Date(batchSettings.topic_submission_start) > new Date() && (
            <span> It is scheduled to open on <strong className="text-blue-600">{new Date(batchSettings.topic_submission_start).toLocaleString()}</strong>.</span>
          )}
        </p>
        <Button variant="outline" onClick={() => navigate('/student/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
         <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-900/20 rounded-3xl text-blue-600 mb-2">
            <Lightbulb size={32} />
         </div>
         <h1 className="text-3xl font-black tracking-tight text-gray-800 dark:text-white">Project Topic Proposal</h1>
         <p className="text-gray-500 max-w-lg mx-auto">Seal your project identity by submitting your research concept for guide and coordinator validation.</p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-t-4 border-t-blue-600">
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <Label>Operational Mode</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                         <button 
                           type="button" 
                           disabled={batchSettings?.project_type_mode === 'group'}
                           onClick={() => setFormData({...formData, mode: 'individual'})}
                           className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                             formData.mode === 'individual' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'
                           } ${batchSettings?.project_type_mode === 'group' ? 'opacity-50 cursor-not-allowed' : ''}`}
                         >
                           Individual
                         </button>
                         <button 
                           type="button" 
                           disabled={batchSettings?.project_type_mode === 'individual'}
                           onClick={() => setFormData({...formData, mode: 'group'})}
                           className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                             formData.mode === 'group' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'
                           } ${batchSettings?.project_type_mode === 'individual' ? 'opacity-50 cursor-not-allowed' : ''}`}
                         >
                           Group Base
                         </button>
                      </div>
                      {batchSettings?.project_type_mode !== 'mixed' && (
                        <p className="text-[10px] text-orange-500 font-bold mt-2 uppercase tracking-tighter">
                          <AlertTriangle size={10} className="inline mr-1" /> Enforced by Coordinator: {batchSettings?.project_type_mode} only
                        </p>
                      )}
                   </div>
                   <div>
                      <Label>Project Domain</Label>
                      <select 
                        value={formData.domain}
                        onChange={e => setFormData({...formData, domain: e.target.value})}
                        className="w-full mt-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                      >
                         <option>Artificial Intelligence & ML</option>
                         <option>Blockchain & Web3</option>
                         <option>Cloud Infrastructure</option>
                         <option>Internet of Things (IoT)</option>
                         <option>Web & Mobile Engineering</option>
                      </select>
                   </div>
                </div>

                <div>
                   <Label>Proposed Project Title</Label>
                   <Input 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Decentralized Voting System using Ethereum" 
                    className="mt-2 h-12 text-sm" 
                    required 
                   />
                </div>

                {formData.mode === 'group' && (
                  <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                     <div className="flex items-center gap-2 mb-4">
                        <Users size={18} className="text-blue-600" />
                        <h4 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest">Collaborator Assignment</h4>
                     </div>
                     <p className="text-[10px] text-gray-500 font-bold mb-4 uppercase tracking-tighter">Enter member emails to send invitations to your group hive.</p>
                     <div className="space-y-3">
                        <Input 
                          placeholder="Member 2 Email Address" 
                          className="h-10 text-xs" 
                          value={formData.memberEmails[0]}
                          onChange={e => {
                            const newEmails = [...formData.memberEmails];
                            newEmails[0] = e.target.value;
                            setFormData({...formData, memberEmails: newEmails});
                          }}
                        />
                        <Input 
                          placeholder="Member 3 Email Address" 
                          className="h-10 text-xs" 
                          value={formData.memberEmails[1]}
                          onChange={e => {
                            const newEmails = [...formData.memberEmails];
                            newEmails[1] = e.target.value;
                            setFormData({...formData, memberEmails: newEmails});
                          }}
                        />
                     </div>
                  </div>
                )}

                <div>
                   <Label>Executive Summary / Abstract</Label>
                   <Textarea 
                     value={formData.description}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     placeholder="Outline the problem statement, objectives, and proposed methodology in 200-300 words..." 
                     className="mt-2 h-40 text-sm leading-relaxed"
                     required
                   />
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                   <ShieldCheck size={20} className="text-green-500 flex-shrink-0" />
                   <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                     By submitting this proposal, you confirm that the project domain is unique and you have discussed the initial feasibility with your temporary mentor.
                   </p>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                   {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Seal & Submit Proposal
                </button>
             </div>
          </Card>
        </form>
      ) : (
        <Card className="text-center py-20 px-8">
           <div className="inline-flex p-5 bg-green-50 dark:bg-green-900/20 rounded-full text-green-500 mb-6">
              <CheckCircle2 size={48} />
           </div>
           <h2 className="text-2xl font-black text-gray-800 dark:text-white">Proposal Successfully Transmitted</h2>
           <p className="text-gray-500 mt-3 max-w-sm mx-auto">
             Your project topic has been sent for review. You can track the approval status on your <span className="text-blue-600 font-black cursor-pointer" onClick={() => navigate('/student/dashboard')}>dashboard</span>.
           </p>
           {formData.mode === 'group' && (
             <p className="text-xs text-blue-500 mt-4 font-bold uppercase tracking-widest">Invitations have been sent to your team members.</p>
           )}
           <button 
            onClick={() => setSuccess(false)}
            className="mt-8 px-8 py-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black hover:bg-gray-100 transition-all"
           >
              EDIT SUBMISSION
           </button>
        </Card>
      )}

      <div className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 rounded-2xl backdrop-blur-sm">
         <Info size={24} className="text-blue-500 flex-shrink-0" />
         <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Important Instruction</p>
            <p className="text-xs text-gray-500 font-medium">Topic approval is a mandatory gateway. You will gain access to the Task Board and Document Submission portal once your topic is greenlit by your mentor.</p>
         </div>
      </div>
    </div>
  );
};

export default TopicSubmission;
