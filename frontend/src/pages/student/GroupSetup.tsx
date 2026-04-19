import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Input from '../../components/common/UI/Input';
import Badge from '../../components/common/UI/Badge';
import { 
  Users, Mail, Shield, AlertCircle, Trash2
} from 'lucide-react';

const GroupSetup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState([
    { name: 'You (Jestin)', email: 'jestin@univ.edu', role: 'Leader', status: 'Active' },
  ]);

  const handleAddMember = () => {
    if (!email) return;
    setMembers([...members, { 
      name: 'Unregistered User', 
      email, 
      role: 'Member', 
      status: 'Pending Invitation' 
    }]);
    setEmail('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Group Formation</h1>
        <p className="text-gray-500">Form your project collective and assign operational roles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Invitation Panel */}
        <Card className="md:col-span-2">
           <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Invite Collaborators</h3>
                <div className="flex gap-2">
                   <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <Input 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter collaborator email address..." 
                        className="pl-10 h-11"
                      />
                   </div>
                   <button 
                    onClick={handleAddMember}
                    className="px-6 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                   >
                     INVITE
                   </button>
                </div>
              </div>

              <div>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Current Collective</h3>
                 <div className="space-y-3">
                    {members.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center font-black text-xs text-blue-600 shadow-sm">
                               {m.name[0]}
                            </div>
                            <div>
                               <p className="text-sm font-black">{m.name}</p>
                               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{m.email}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <Badge variant={m.status === 'Active' ? 'success' : 'warning'} className="text-[9px] font-black">
                               {m.status === 'Active' ? 'SYNCED' : 'PENDING'}
                            </Badge>
                            {i !== 0 && (
                              <button className="text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            )}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                 <button className="w-full py-4 bg-gray-100 dark:bg-gray-700/50 text-gray-400 rounded-2xl text-xs font-black uppercase tracking-widest cursor-not-allowed">
                    Lock Collective & Update Dashboard
                 </button>
                 <p className="text-[9px] text-gray-400 text-center mt-3 font-bold uppercase tracking-tighter">Formation locks after all invited members accept.</p>
              </div>
           </div>
        </Card>

        {/* Info Sidebar */}
        <div className="space-y-6">
           <Card className="bg-blue-600 text-white">
              <h4 className="text-xs font-black uppercase tracking-widest opacity-70 mb-4">Formation Roles</h4>
              <div className="space-y-4">
                 <div className="flex gap-3">
                    <Shield size={20} className="flex-shrink-0" />
                    <div>
                       <p className="text-xs font-black">Group Leader</p>
                       <p className="text-[9px] opacity-70 font-medium">Responsible for task allocation and final submission.</p>
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <Users size={20} className="flex-shrink-0" />
                    <div>
                       <p className="text-xs font-black">Contributor</p>
                       <p className="text-[9px] opacity-70 font-medium">Core member fulfilling project milestones.</p>
                    </div>
                 </div>
              </div>
           </Card>

           <div className="p-5 border border-orange-100 dark:border-orange-900/30 bg-orange-50/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-orange-600">
                 <AlertCircle size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Crucial Hint</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                You can invite up to 3 members for group-base projects. Individual mode does not support formation.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GroupSetup;
