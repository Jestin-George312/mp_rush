import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/UI/Card';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import Textarea from '../../components/common/UI/Textarea';
import { 
  Send, Info, Users, 
  Lightbulb, ShieldCheck
} from 'lucide-react';

const TopicSubmission: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('individual');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
  };

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
                           onClick={() => setMode('individual')}
                           className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                             mode === 'individual' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'
                           }`}
                         >
                           Individual
                         </button>
                         <button 
                           type="button" 
                           onClick={() => setMode('group')}
                           className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                             mode === 'group' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'
                           }`}
                         >
                           Group Base
                         </button>
                      </div>
                   </div>
                   <div>
                      <Label>Project Domain</Label>
                      <select className="w-full mt-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20">
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
                   <Input placeholder="e.g. Decentralized Voting System using Ethereum" className="mt-2 h-12 text-sm" required />
                </div>

                {mode === 'group' && (
                  <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                     <div className="flex items-center gap-2 mb-4">
                        <Users size={18} className="text-blue-600" />
                        <h4 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest">Collaborator Assignment</h4>
                     </div>
                     <p className="text-[10px] text-gray-500 font-bold mb-4 uppercase tracking-tighter">Enter member emails to form your group hive.</p>
                     <div className="space-y-3">
                        <Input placeholder="Member 2 Email Address" className="h-10 text-xs" />
                        <Input placeholder="Member 3 Email Address" className="h-10 text-xs" />
                     </div>
                  </div>
                )}

                <div>
                   <Label>Executive Summary / Abstract</Label>
                   <Textarea 
                     placeholder="Outline the problem statement, objectives, and proposed methodology in 200-300 words..." 
                     className="mt-2 h-40 text-sm leading-relaxed"
                     required
                   />
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                   <ShieldCheck size={20} className="text-green-500 flex-shrink-0" />
                   <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                     By submitting this proposal, you confirm that the project domain is unique and you have discussed the initial feasibility with a potential guide.
                   </p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
                >
                   <Send size={18} /> Seal & Submit Proposal
                </button>
             </div>
          </Card>
        </form>
      ) : (
        <Card className="text-center py-20 px-8">
           <div className="inline-flex p-5 bg-green-50 rounded-full text-green-500 mb-6">
              <ShieldCheck size={48} />
           </div>
           <h2 className="text-2xl font-black text-gray-800 dark:text-white">Proposal Successfully Transmitted</h2>
           <p className="text-gray-500 mt-3 max-w-sm mx-auto">
             Your project topic has been sent for review. You can track the approval status on your <span className="text-blue-600 font-black cursor-pointer" onClick={() => navigate('/student/dashboard')}>dashboard</span>.
           </p>
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
