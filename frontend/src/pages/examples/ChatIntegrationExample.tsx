import { useState } from 'react';
import ChatComponent from '../../components/ChatComponent';
import { useAuth } from '../../hooks/useAuth'; // Adjust path to your auth hook

/**
 * Example: How to integrate Chat Component in a Group Details/Project Page
 * This shows a real-world implementation
 */
export default function GroupDetailPage({ groupId }: { groupId: number }) {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(true);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Main Content - Group Details */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-4">Group Details</h1>
          
          {/* Your existing group content here */}
          <div className="space-y-4">
            <section>
              <h2 className="text-xl font-semibold mb-2">Group Name</h2>
              <p className="text-gray-600">Your group information...</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Tasks</h2>
              <p className="text-gray-600">Group tasks go here...</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Documents</h2>
              <p className="text-gray-600">Group documents go here...</p>
            </section>
          </div>
        </div>
      </div>

      {/* Sidebar - Chat Component */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-96">
            <ChatComponent
              groupId={groupId}
              currentUserId={user.id}
              currentUserRole={user.role}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative: Modal/Popup Chat
 */
export function GroupDetailWithModalChat({ groupId }: { groupId: number }) {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Group Details</h1>
        <button
          onClick={() => setChatOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          💬 Open Chat
        </button>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Group details content */}
      </div>

      {/* Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md h-96">
            <ChatComponent
              groupId={groupId}
              currentUserId={user.id}
              currentUserRole={user.role}
              onClose={() => setChatOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Alternative: Full-width Chat Page
 */
export function ChatPage({ groupId }: { groupId: number }) {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1">
        <ChatComponent
          groupId={groupId}
          currentUserId={user.id}
          currentUserRole={user.role}
        />
      </div>
    </div>
  );
}
