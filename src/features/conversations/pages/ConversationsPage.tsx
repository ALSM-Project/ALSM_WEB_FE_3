import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Plus,
  RefreshCw,
  Send,
  Paperclip,
  User,
  ShieldCheck,
  FolderGit2,
  HelpCircle,
  X,
  FileText,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Button, Modal } from '@/shared/ui';
import { conversationsApi } from '../api/conversations.api';
import type {
  ConversationItem,
  ConversationMessageItem,
  ConversationType,
} from '../types/conversation';
import { projectService } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/types/project';

export const ConversationsPage: React.FC = () => {
  const { user } = useAuth();
  const { organization } = useWorkspace();
  const [searchParams] = useSearchParams();

  const activeProjectIdParam = searchParams.get('projectId') || '';

  // State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ConversationMessageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PROJECT' | 'SUPPORT'>('ALL');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  // Composer
  const [messageText, setMessageText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; size: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Conversation Modal
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newForm, setNewForm] = useState<{
    title: string;
    conversationType: ConversationType;
    projectId: string;
    initialMessage: string;
  }>({
    title: '',
    conversationType: 'PROJECT',
    projectId: '',
    initialMessage: '',
  });

  // Role detection: Viewer is read-only
  const userRole = (user?.role || '').toUpperCase();
  const isViewer = userRole === 'VIEWER';

  // Load Projects for linkage
  useEffect(() => {
    projectService
      .getProjects()
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch((err) => console.warn('Failed to load projects for conversations:', err));
  }, []);

  // Fetch Conversations
  const fetchConversations = async (autoSelectId?: string) => {
    try {
      setLoading(true);
      const data = await conversationsApi.list({
        organizationId: organization?.id,
        projectId: activeProjectIdParam || undefined,
        type: typeFilter,
        search: searchTerm.trim() || undefined,
        unreadOnly,
      });

      setConversations(data);

      if (data.length > 0) {
        const toSelect = autoSelectId
          ? data.find((c) => c.id === autoSelectId) || data[0]
          : activeConversation
          ? data.find((c) => c.id === activeConversation.id) || data[0]
          : data[0];
        setActiveConversation(toSelect);
        loadMessages(toSelect.id);
      } else {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [typeFilter, unreadOnly, organization?.id, activeProjectIdParam]);

  // Load messages for a selected conversation
  const loadMessages = async (convId: string) => {
    try {
      setMessagesLoading(true);
      const list = await conversationsApi.listMessages(convId);
      setMessages(list);

      // Decrement/reset unread count in UI
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setMessagesLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  // Scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  };

  // Setup WebSocket for active conversation
  useEffect(() => {
    if (!activeConversation) return;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = conversationsApi.createWebSocket(
      activeConversation.id,
      { id: user?.id, email: user?.email, fullName: user?.fullName },
      {
        onOpen: () => setWsConnected(true),
        onClose: () => setWsConnected(false),
        onError: () => setWsConnected(false),
        onMessage: (newMsg) => {
          if (newMsg.conversationId === activeConversation.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 100);
          }
        },
        onConversationUpdated: (updated) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
          );
        },
      },
    );

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [activeConversation?.id, user?.email]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isViewer) return;
    if ((!messageText.trim() && attachedFiles.length === 0) || !activeConversation || sending) {
      return;
    }

    try {
      setSending(true);
      const attachments = attachedFiles.map((f) => ({
        name: f.name,
        size: f.size,
        mimeType: 'application/octet-stream',
      }));

      const createdMsg = await conversationsApi.postMessage(activeConversation.id, {
        content: messageText.trim() || 'Attached file(s)',
        attachments,
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === createdMsg.id)) return prev;
        return [...prev, createdMsg];
      });

      setMessageText('');
      setAttachedFiles([]);

      // Update conversation in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                lastMessage: messageText.trim() || 'Attached file(s)',
                lastMessageAt: new Date().toISOString(),
              }
            : c,
        ),
      );

      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to post message:', err);
    } finally {
      setSending(false);
    }
  };

  // Handle Enter to send, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: f.size,
      }));
      setAttachedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  // Handle New Conversation Submit
  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.title.trim()) return;

    try {
      const selectedProject = projects.find((p) => p.id === newForm.projectId);
      const created = await conversationsApi.create({
        title: newForm.title.trim(),
        conversationType: newForm.conversationType,
        projectId: newForm.projectId || undefined,
        projectName: selectedProject?.name,
        organizationId: organization?.id,
        customerName: user?.fullName || user?.email?.split('@')[0] || 'Client User',
        customerEmail: user?.email || 'client@enterprise.com',
        companyName: organization?.name || 'Enterprise Customer',
        initialMessage: newForm.initialMessage.trim() || undefined,
      });

      setShowNewModal(false);
      setNewForm({
        title: '',
        conversationType: 'PROJECT',
        projectId: '',
        initialMessage: '',
      });

      // Refetch and select the newly created conversation
      await fetchConversations(created.id);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  // Helper: Format Date
  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full space-y-4 min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-[#D9E2EC] shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0652CC] bg-[#E8F1FF] px-2 py-0.5 rounded-full">
              Enterprise Collaboration
            </span>
            <span className="text-xs font-semibold text-[#6B778C]">
              Project-Based Group Chat
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#091E42] tracking-tight mt-1">
            Conversations
          </h1>
          <p className="text-xs text-[#42526E] mt-0.5 max-w-2xl">
            Direct real-time communication channel with your assigned ALSM Solutions Architects,
            Team Leads, and Modernization Engineers.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Button
            variant="secondary"
            onClick={() => fetchConversations()}
            disabled={loading}
            className="text-xs flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {!isViewer && (
            <Button
              variant="primary"
              onClick={() => setShowNewModal(true)}
              className="text-xs flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Conversation</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main 2-Panel Chat Workspace */}
      <div className="w-full bg-white rounded-xl border border-[#D9E2EC] shadow-2xs overflow-hidden flex flex-col md:flex-row h-[720px] min-w-0">
        {/* Left Panel: Conversation List */}
        <div className="w-full md:w-[340px] lg:w-[380px] shrink-0 border-r border-[#D9E2EC] flex flex-col bg-[#F8FAFC]">
          {/* Search & Filters */}
          <div className="p-3.5 border-b border-[#D9E2EC] bg-white space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#6B778C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F4F6F8] border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  typeFilter === 'ALL'
                    ? 'bg-[#0652CC] text-white'
                    : 'bg-[#EBECF0] text-[#42526E] hover:bg-[#DFE1E6]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('PROJECT')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  typeFilter === 'PROJECT'
                    ? 'bg-[#0652CC] text-white'
                    : 'bg-[#EBECF0] text-[#42526E] hover:bg-[#DFE1E6]'
                }`}
              >
                Projects
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('SUPPORT')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  typeFilter === 'SUPPORT'
                    ? 'bg-[#0652CC] text-white'
                    : 'bg-[#EBECF0] text-[#42526E] hover:bg-[#DFE1E6]'
                }`}
              >
                Support
              </button>
              <button
                type="button"
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  unreadOnly
                    ? 'bg-[#FF5630] text-white'
                    : 'bg-[#EBECF0] text-[#42526E] hover:bg-[#DFE1E6]'
                }`}
              >
                Unread
              </button>
            </div>
          </div>

          {/* Conversation Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5EAF0]">
            {loading && conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B778C]">
                <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#0652CC]" />
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B778C] space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-[#C1C7D0]" />
                <p className="font-semibold text-[#091E42]">No conversations found</p>
                <p className="text-[11px] text-[#42526E]">
                  Conversations are scoped to your assigned modernization projects and requests.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                const isProject = conv.conversationType === 'PROJECT' || Boolean(conv.projectId);

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setActiveConversation(conv);
                      loadMessages(conv.id);
                    }}
                    className={`w-full text-left p-3.5 transition-colors flex items-start space-x-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBF3FF] border-l-4 border-[#0652CC]'
                        : 'hover:bg-[#F4F6F8] bg-white'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs shadow-2xs text-white bg-gradient-to-br from-[#0652CC] to-[#0065FF]">
                      {isProject ? (
                        <FolderGit2 className="w-4 h-4" />
                      ) : (
                        <HelpCircle className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-xs text-[#091E42] truncate">
                          {conv.title}
                        </h4>
                        <span className="text-[10px] text-[#6B778C] shrink-0 ml-1.5 font-medium">
                          {formatTime(conv.lastMessageAt || conv.createdAt)}
                        </span>
                      </div>

                      {conv.projectName && (
                        <div className="inline-block text-[10px] font-semibold text-[#0652CC] bg-[#E8F1FF] px-1.5 py-0.2 rounded mb-1 truncate max-w-[200px]">
                          {conv.projectName}
                        </div>
                      )}

                      <p className="text-[11px] text-[#42526E] truncate leading-snug">
                        {typeof conv.lastMessage === 'string'
                          ? conv.lastMessage
                          : (conv.lastMessage as any)?.content || 'No messages yet'}
                      </p>

                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-[#F1F3F5] text-[10px] text-[#6B778C]">
                        <span className="flex items-center space-x-1 truncate max-w-[170px]">
                          <User className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {conv.assignedToName || 'ALSM Modernization Team'}
                          </span>
                        </span>

                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-[#FF5630] text-white text-[9px] font-bold rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Chat Workspace */}
        <div className="flex-1 flex flex-col bg-white min-w-0 h-full">
          {activeConversation ? (
            <>
              {/* Workspace Header */}
              <div className="p-3.5 px-5 border-b border-[#D9E2EC] flex items-center justify-between bg-white shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-[#091E42] truncate">
                      {activeConversation.title}
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full ${
                        activeConversation.conversationType === 'PROJECT'
                          ? 'bg-[#E8F1FF] text-[#0652CC]'
                          : 'bg-[#EAE6FF] text-[#403294]'
                      }`}
                    >
                      {activeConversation.conversationType || 'PROJECT'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-[#6B778C] mt-0.5 truncate">
                    {activeConversation.projectName && (
                      <span className="flex items-center space-x-1 truncate">
                        <FolderGit2 className="w-3 h-3 text-[#0652CC]" />
                        <span className="font-semibold text-[#091E42]">
                          {activeConversation.projectName}
                        </span>
                      </span>
                    )}

                    <span className="text-[#DFE1E6]">•</span>

                    <span className="flex items-center space-x-1 truncate">
                      <ShieldCheck className="w-3 h-3 text-[#36B37E]" />
                      <span>
                        ALSM Team: {activeConversation.assignedToName || 'Lead & Staff Assigned'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Live Status indicator */}
                <div className="flex items-center space-x-2 shrink-0 ml-3">
                  <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#F4F6F8] rounded-full border border-[#DFE3E8] text-[10px] font-semibold text-[#42526E]">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        wsConnected ? 'bg-[#36B37E] animate-pulse' : 'bg-[#C1C7D0]'
                      }`}
                    />
                    <span>{wsConnected ? 'Live Channel' : 'Synced'}</span>
                  </div>
                </div>
              </div>

              {/* Message Timeline */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#F8FAFC]">
                {messagesLoading ? (
                  <div className="py-20 text-center text-xs text-[#6B778C]">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-[#0652CC]" />
                    Loading message history...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-24 text-center max-w-sm mx-auto space-y-2">
                    <MessageSquare className="w-10 h-10 text-[#C1C7D0] mx-auto" />
                    <p className="font-bold text-sm text-[#091E42]">Start the conversation</p>
                    <p className="text-xs text-[#42526E]">
                      Post updates, share conversion feedback, or request guidance from your assigned
                      ALSM Solutions Architect team.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe =
                      msg.senderEmail?.toLowerCase() === user?.email?.toLowerCase() ||
                      msg.senderRole === 'CUSTOMER';
                    const isSystem = msg.senderRole === 'SYSTEM';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center my-3">
                          <span className="inline-block px-3 py-1 bg-[#EBECF0] text-[#42526E] text-[11px] font-medium rounded-full">
                            {msg.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center space-x-2 mb-1 px-1 text-[11px] text-[#6B778C]">
                          <span className="font-bold text-[#091E42]">{msg.senderName}</span>
                          {!isMe && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-[#E8F1FF] text-[#0652CC]">
                              ALSM Team
                            </span>
                          )}
                          <span className="text-[10px] text-[#6B778C]">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>

                        <div
                          className={`max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                            isMe
                              ? 'bg-[#0652CC] text-white rounded-tr-xs'
                              : 'bg-white text-[#091E42] border border-[#DFE3E8] rounded-tl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-white/20 space-y-1">
                              {msg.attachments.map((att, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center space-x-2 px-2 py-1 rounded text-[11px] ${
                                    isMe
                                      ? 'bg-white/10 text-white'
                                      : 'bg-[#F4F6F8] text-[#0652CC]'
                                  }`}
                                >
                                  <FileText className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{att.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <div className="p-3.5 border-t border-[#D9E2EC] bg-white shrink-0">
                {isViewer ? (
                  <div className="p-3 bg-[#F4F6F8] border border-[#DFE3E8] rounded-lg text-xs text-[#42526E] flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-[#6B778C] shrink-0" />
                    <span>Your organization role has read-only access to this conversation.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="space-y-2">
                    {attachedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {attachedFiles.map((file, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center space-x-1.5 px-2 py-1 bg-[#E8F1FF] text-[#0652CC] rounded-md text-[11px] font-medium"
                          >
                            <FileText className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))
                              }
                              className="text-[#6B778C] hover:text-[#FF5630]"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-end space-x-2">
                      <div className="flex-1 relative bg-[#F8FAFC] border border-[#DFE3E8] rounded-xl focus-within:border-[#0652CC] focus-within:bg-white transition-all">
                        <textarea
                          rows={2}
                          placeholder="Type your message... (Enter to send, Shift + Enter for new line)"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="w-full p-2.5 text-xs bg-transparent focus:outline-none resize-none text-[#091E42] placeholder-[#6B778C]"
                        />

                        <div className="flex items-center justify-between px-2.5 pb-2">
                          <div className="flex items-center space-x-1">
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              className="hidden"
                              multiple
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="p-1.5 text-[#6B778C] hover:text-[#0652CC] hover:bg-[#EBECF0] rounded-md transition-colors"
                              title="Attach files"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-[10px] text-[#6B778C]">
                            Press Enter ↵ to send
                          </span>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        disabled={sending || (!messageText.trim() && attachedFiles.length === 0)}
                        className="h-10 px-4 text-xs shrink-0 flex items-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#6B778C] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#F4F6F8] border border-[#DFE3E8] flex items-center justify-center text-[#0652CC]">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-[#091E42]">Select a conversation</h3>
              <p className="text-xs text-[#42526E] max-w-sm">
                Choose a project channel or support conversation from the list to collaborate with
                your assigned ALSM modernization team.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewModal && (
        <Modal
          isOpen={showNewModal}
          onClose={() => setShowNewModal(false)}
          title="Start New Communication Channel"
        >
          <form onSubmit={handleCreateConversation} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#091E42] mb-1">
                Conversation Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() =>
                    setNewForm((prev) => ({ ...prev, conversationType: 'PROJECT' }))
                  }
                  className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 ${
                    newForm.conversationType === 'PROJECT'
                      ? 'border-[#0652CC] bg-[#E8F1FF] text-[#0652CC]'
                      : 'border-[#DFE3E8] bg-white text-[#42526E]'
                  }`}
                >
                  <FolderGit2 className="w-4 h-4" />
                  <span>Project Modernization</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNewForm((prev) => ({ ...prev, conversationType: 'SUPPORT' }))
                  }
                  className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 ${
                    newForm.conversationType === 'SUPPORT'
                      ? 'border-[#0652CC] bg-[#E8F1FF] text-[#0652CC]'
                      : 'border-[#DFE3E8] bg-white text-[#42526E]'
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Technical Support</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#091E42] mb-1">
                Channel Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BMS Screen Modernization — Core Accounting"
                value={newForm.title}
                onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
              />
            </div>

            {newForm.conversationType === 'PROJECT' && (
              <div>
                <label className="block text-xs font-bold text-[#091E42] mb-1">
                  Related Modernization Project
                </label>
                <select
                  value={newForm.projectId}
                  onChange={(e) => setNewForm({ ...newForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42] bg-white"
                >
                  <option value="">Select project (optional)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#091E42] mb-1">
                Initial Message / Topic Agenda
              </label>
              <textarea
                rows={3}
                placeholder="Describe your inquiry or discussion points..."
                value={newForm.initialMessage}
                onChange={(e) => setNewForm({ ...newForm, initialMessage: e.target.value })}
                className="w-full p-2.5 text-xs border border-[#DFE3E8] rounded-lg focus:outline-none focus:border-[#0652CC] text-[#091E42]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#E5EAF0]">
              <Button variant="secondary" onClick={() => setShowNewModal(false)} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Create Channel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
