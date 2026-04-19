import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Input from '../../components/common/UI/Input';
import Label from '../../components/common/UI/Label';
import Textarea from '../../components/common/UI/Textarea';
import { 
  PlusCircle, Users,
  Send, ShieldAlert, CheckCircle2 
} from 'lucide-react';

const ProjectSetup: React.FC = () => {
  const [mode, setMode] = useState<'individual' | 'group'>('individual');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
         <h1 className="text-3xl font-black tracking-tight text-gray-800 dark:text-white">Project Initiation</h1>
         <p className="text-gray-500">Define your research scope and collaboration structure</p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-t-4 border-t-blue-600">
             <div className="space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <Label>Proposed Project Title</Label>
                      <Input placeholder="e.g. Intelligent Edge Gateway for IoT" className="mt-2" required />
                   </div>
                   <div>
                      <Label>Technology Domain</Label>
                      <select className="w-full mt-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20">
                         <option>ML & Data Science</option>
                         <option>Fullstack Development</option>
                         <option>Blockchain</option>
                         <option>Cybersecurity</option>
                         <option>IoT & Embedded</option>
                      </select>
                   </div>
                </div>

                {mode === 'group' && (
                  <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                     <h4 className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest mb-4">Team Formation</h4>
                     <div className="space-y-4">
                        <Input placeholder="Member 2 Email Address" className="h-11" />
                        <Input placeholder="Member 3 Email Address" className="h-11" />
                        <p className="text-[10px] text-gray-400 font-bold italic">* You will automatically be assigned as the Group Leader.</p>
                     </div>
                  </div>
                )}

                <div>
                   <Label>Project Description / Abstract</Label>
                   <Textarea 
                     placeholder="Clearly define the problem statement, objectives, and proposed technical architecture..." 
                     className="mt-2 h-40 text-sm leading-relaxed"
                     required
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
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                >
                   <Send size={18} /> Initialize Project Entity
                </button>
             </div>
          </Card>
        </form>
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
