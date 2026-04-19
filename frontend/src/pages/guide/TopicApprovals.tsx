import React, { useState } from 'react';
import Card from '../../components/common/UI/Card';
import Button from '../../components/common/UI/Button';
import Badge from '../../components/common/UI/Badge';
import Modal from '../../components/common/UI/Modal';
import Input from '../../components/common/UI/Input';
import { 
  CheckCircle, XCircle, Search, 
  Filter, Eye, AlertCircle
} from 'lucide-react';

const TopicApprovals: React.FC = () => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);

  const pendingTopics = [
    {
      id: '1',
      batch: 'MCA 2024-26 A',
      group: 'EcoSync',
      title: 'AI Based Sustainable Energy Management',
      domain: 'Artificial Intelligence',
      members: ['John Doe', 'Jane Smith', 'Bob Wilson'],
      submittedAt: '2 days ago',
      description: 'A platform to optimize energy consumption in residential areas using predictive modeling...'
    },
    {
      id: '2',
      batch: 'MSc CS 2023-25',
      group: 'Nexus',
      title: 'Decentralized Healthcare Records',
      domain: 'Blockchain',
      members: ['Alice Brown', 'Charlie Davis'],
      submittedAt: 'Just now',
      description: 'Securing patient records on a private blockchain network to ensure privacy and interoperability...'
    }
  ];

  const handleOpenDetail = (topic: any) => {
    setSelectedTopic(topic);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-800 dark:text-white">Topic Approvals</h1>
          <p className="text-gray-500">Review and validate student project proposals</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button className="px-4 py-1.5 text-xs font-black bg-white dark:bg-gray-700 shadow-sm rounded-lg">Pending</button>
          <button className="px-4 py-1.5 text-xs font-black text-gray-400">Approved</button>
          <button className="px-4 py-1.5 text-xs font-black text-gray-400">Rejected</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input placeholder="Search proposals..." className="pl-10" />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter size={16} /> Filter by Batch
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pendingTopics.map((topic) => (
          <Card key={topic.id} className="border-l-4 border-l-blue-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-[9px] font-black">{topic.batch}</Badge>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{topic.domain}</span>
                </div>
                <h3 className="text-lg font-black text-gray-800 dark:text-white">{topic.title}</h3>
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 font-bold uppercase">
                   <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Group: {topic.group}</div>
                   <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> {topic.members.length} Members</div>
                   <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {topic.submittedAt}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => handleOpenDetail(topic)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-100 dark:border-gray-700"
                 >
                   <Eye size={16} /> Inspect Proposal
                 </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedTopic && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Project Proposal Detail"
        >
          <div className="space-y-6">
             <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                <h4 className="text-sm font-black text-blue-800 dark:text-blue-300 mb-2">Subject: {selectedTopic.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  {selectedTopic.description}
                </p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                   <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Domain</p>
                   <p className="text-xs font-bold">{selectedTopic.domain}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                   <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Submission Date</p>
                   <p className="text-xs font-bold">{selectedTopic.submittedAt}</p>
                </div>
             </div>

             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Group Composition</p>
                <div className="flex flex-wrap gap-2">
                   {selectedTopic.members.map((m: string) => (
                     <div key={m} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-[11px] font-black">
                       {m}
                     </div>
                   ))}
                </div>
             </div>

             <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-3">
                   <button className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all">
                      <XCircle size={16} /> Reject
                   </button>
                   <button className="flex-1 py-3 bg-orange-50 text-orange-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-orange-600 hover:text-white transition-all">
                      <AlertCircle size={16} /> Request Revision
                   </button>
                   <button className="flex-[2] py-3 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
                      <CheckCircle size={16} /> Approve Topic
                   </button>
                </div>
             </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TopicApprovals;
