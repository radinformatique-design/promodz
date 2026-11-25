'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MessageSquare,
  MessageSquareText,
  Send,
  Paperclip,
  Search,
  Building,
  HardHat,
  Users,
  UserPlus,
  ShieldCheck,
  CheckCheck,
  Clock,
  Plus,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Phone,
  Mail,
  UserCheck,
  Check,
  Shield,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ChatMessage, MessageType, ChatContextReference, ChatAttachment, Utilisateur, ChatGroupInfo } from '../types/database';

export const MessagerieView: React.FC = () => {
  const {
    currentUser,
    utilisateurs,
    allChantiers,
    demandesAchat,
    controlesCTC,
    situationsTravaux,
    messages,
    envoyerMessage,
    marquerConversationLue,
    creerGroupeDiscussion,
    setActiveNav
  } = useApp();

  const [activeConversationId, setActiveConversationId] = useState<string>('general');
  const [filterType, setFilterType] = useState<'ALL' | 'CHANTIER' | 'DIRECT' | 'GENERAL' | 'GROUPE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showDetailsPane, setShowDetailsPane] = useState(true);

  // Modale Création de Groupe & Sélection des personnes
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [participantFilter, setParticipantFilter] = useState<'ALL' | 'CENTRAL' | 'CHANTIER'>('ALL');
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Modale consultation des membres du groupe
  const [isViewMembersModalOpen, setIsViewMembersModalOpen] = useState(false);

  // Document reference modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedContextRef, setSelectedContextRef] = useState<ChatContextReference | null>(null);

  // Attachments pending
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Définition et construction dynamique de la liste des conversations
  const conversations = useMemo(() => {
    const list: {
      id: string;
      type: MessageType;
      titre: string;
      sous_titre: string;
      badge_role?: string;
      is_online?: boolean;
      avatar_initials: string;
      target_user?: Utilisateur;
      target_chantier_id?: string;
      target_chantier_nom?: string;
      group_info?: ChatGroupInfo;
      dernier_message?: ChatMessage;
      non_lus: number;
    }[] = [];

    // A. Canal Général Siège
    const generalMessages = messages.filter(m => m.conversation_id === 'general' || m.type === 'GENERAL');
    const lastGen = generalMessages[generalMessages.length - 1];
    const unreadGen = generalMessages.filter(m => !m.lu && m.expediteur_id !== currentUser?.id).length;
    list.push({
      id: 'general',
      type: 'GENERAL',
      titre: 'Canal Général & Direction',
      sous_titre: 'Communications officielles et notes de service',
      avatar_initials: 'DG',
      dernier_message: lastGen,
      non_lus: unreadGen
    });

    // B. Canaux de Chantiers
    allChantiers.forEach(ch => {
      const convId = `chantier_${ch.id}`;
      const chMessages = messages.filter(m => m.conversation_id === convId || m.chantier_id === ch.id);
      const lastCh = chMessages[chMessages.length - 1];
      const unreadCh = chMessages.filter(m => !m.lu && m.expediteur_id !== currentUser?.id).length;

      list.push({
        id: convId,
        type: 'CHANTIER',
        titre: ch.nom_projet,
        sous_titre: `${ch.code_chantier} · ${ch.wilaya}`,
        avatar_initials: ch.code_chantier?.slice(-3) || 'CHT',
        target_chantier_id: ch.id,
        target_chantier_nom: ch.nom_projet,
        dernier_message: lastCh,
        non_lus: unreadCh
      });
    });

    // C. Groupes Personnalisés de Discussion
    const groupMap = new Map<string, ChatGroupInfo>();
    messages.forEach(m => {
      if (m.type === 'GROUPE' && m.group_info) {
        groupMap.set(m.conversation_id, m.group_info);
      }
    });

    groupMap.forEach((grp, convId) => {
      // Afficher le groupe si l'utilisateur est participant ou administrateur
      const isMember = grp.participants_ids?.includes(currentUser?.id || '') ||
                       currentUser?.role_id === 'role-admin' ||
                       currentUser?.role_id === 'e1765d0a-e4f1-6f94-9f3c-d757a576d60e' ||
                       currentUser?.poste?.includes('Admin');
      if (!isMember) return;

      const grpMessages = messages.filter(m => m.conversation_id === convId);
      const lastMsg = grpMessages[grpMessages.length - 1];
      const unreadGrp = grpMessages.filter(m => !m.lu && m.expediteur_id !== currentUser?.id).length;
      const count = grp.participants_ids?.length || 0;

      list.push({
        id: convId,
        type: 'GROUPE',
        titre: grp.nom,
        sous_titre: `${count} participant${count > 1 ? 's' : ''}${grp.description ? ` · ${grp.description}` : ''}`,
        badge_role: 'Groupe',
        avatar_initials: (grp.nom || 'GP').slice(0, 2).toUpperCase(),
        group_info: grp,
        dernier_message: lastMsg,
        non_lus: unreadGrp
      });
    });

    // D. Messages Privés (1 à 1) avec les autres collègues actifs
    const otherUsers = utilisateurs.filter(u => u.id !== currentUser?.id);
    otherUsers.forEach(u => {
      const pair = [currentUser?.id || 'me', u.id].sort();
      const convId = `direct_${pair[0]}_${pair[1]}`;
      const dirMessages = messages.filter(m => 
        m.conversation_id === convId || 
        (m.type === 'DIRECT' && (
          (m.expediteur_id === currentUser?.id && m.destinataire_id === u.id) ||
          (m.expediteur_id === u.id && m.destinataire_id === currentUser?.id)
        ))
      );
      const lastDir = dirMessages[dirMessages.length - 1];
      const unreadDir = dirMessages.filter(m => !m.lu && m.expediteur_id === u.id).length;

      list.push({
        id: convId,
        type: 'DIRECT',
        titre: `${u.prenom} ${u.nom}`,
        sous_titre: u.poste || 'Collaborateur',
        badge_role: u.type === 'CENTRAL' ? 'Siège' : 'Chantier',
        is_online: u.statut === 'ACTIF',
        avatar_initials: `${u.prenom?.[0] || 'U'}${u.nom?.[0] || 'S'}`.toUpperCase(),
        target_user: u,
        dernier_message: lastDir,
        non_lus: unreadDir
      });
    });

    return list;
  }, [messages, allChantiers, utilisateurs, currentUser]);

  // Filtrage de la liste
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const matchType = filterType === 'ALL' || c.type === filterType;
      const matchQuery = !searchQuery || 
        c.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sous_titre.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchQuery;
    });
  }, [conversations, filterType, searchQuery]);

  // Conversation actuellement sélectionnée
  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConversationId) || conversations[0];
  }, [conversations, activeConversationId]);

  // Messages de la conversation active
  const activeMessages = useMemo(() => {
    if (!activeConversation) return [];
    if (activeConversation.type === 'GENERAL') {
      return messages.filter(m => m.conversation_id === 'general' || m.type === 'GENERAL');
    }
    if (activeConversation.type === 'CHANTIER') {
      return messages.filter(m => 
        m.conversation_id === activeConversation.id || 
        (activeConversation.target_chantier_id && m.chantier_id === activeConversation.target_chantier_id)
      );
    }
    if (activeConversation.type === 'GROUPE') {
      return messages.filter(m => m.conversation_id === activeConversation.id);
    }
    if (activeConversation.type === 'DIRECT' && activeConversation.target_user) {
      const targetId = activeConversation.target_user.id;
      return messages.filter(m => 
        m.conversation_id === activeConversation.id ||
        (m.type === 'DIRECT' && (
          (m.expediteur_id === currentUser?.id && m.destinataire_id === targetId) ||
          (m.expediteur_id === targetId && m.destinataire_id === currentUser?.id)
        ))
      );
    }
    return [];
  }, [messages, activeConversation, currentUser]);

  // Marquer comme lu à l'ouverture de la conversation
  useEffect(() => {
    if (activeConversation && activeConversation.non_lus > 0) {
      marquerConversationLue(activeConversation.id);
    }
  }, [activeConversation?.id, activeConversation?.non_lus, marquerConversationLue]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  // Envoi d'un message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && pendingAttachments.length === 0 && !selectedContextRef) return;

    if (!currentUser || !activeConversation) return;

    const payload: Omit<ChatMessage, 'id' | 'created_at' | 'lu'> = {
      conversation_id: activeConversation.id,
      type: activeConversation.type,
      expediteur_id: currentUser.id,
      expediteur_nom: `${currentUser.prenom} ${currentUser.nom}`,
      expediteur_role: currentUser.poste || 'Collaborateur BatiProm',
      contenu: inputText.trim() || (selectedContextRef ? `Partage de document : ${selectedContextRef.label}` : 'Fichier partagé'),
      pieces_jointes: pendingAttachments,
      reference_contexte: selectedContextRef || undefined
    };

    if (activeConversation.type === 'DIRECT' && activeConversation.target_user) {
      payload.destinataire_id = activeConversation.target_user.id;
      payload.destinataire_nom = `${activeConversation.target_user.prenom} ${activeConversation.target_user.nom}`;
    }

    if (activeConversation.type === 'CHANTIER' && activeConversation.target_chantier_id) {
      payload.chantier_id = activeConversation.target_chantier_id;
      payload.chantier_nom = activeConversation.target_chantier_nom;
    }

    if (activeConversation.type === 'GROUPE' && activeConversation.group_info) {
      payload.group_info = activeConversation.group_info;
    }

    await envoyerMessage(payload);

    setInputText('');
    setPendingAttachments([]);
    setSelectedContextRef(null);
  };

  // Création d'un groupe avec sélection libre des participants
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setGroupError('Veuillez indiquer un titre ou nom pour le groupe.');
      return;
    }
    if (selectedUserIds.length === 0) {
      setGroupError('Veuillez sélectionner au moins un collaborateur supplémentaire.');
      return;
    }

    setIsSubmittingGroup(true);
    setGroupError(null);

    try {
      const res = await creerGroupeDiscussion(newGroupName, newGroupDesc, selectedUserIds);
      if (res.success && res.group) {
        setIsCreateGroupOpen(false);
        setNewGroupName('');
        setNewGroupDesc('');
        setSelectedUserIds([]);
        setActiveConversationId(`groupe_${res.group.id}`);
        setFilterType('GROUPE');
      } else {
        setGroupError(res.error || 'Erreur lors de la création du groupe.');
      }
    } catch (err: any) {
      setGroupError(err?.message || 'Erreur serveur');
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = (filteredList: Utilisateur[]) => {
    const ids = filteredList.map(u => u.id).filter(id => id !== currentUser?.id);
    const allSelected = ids.every(id => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  // Gestion des pièces jointes (fichiers/images)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const newAttach: ChatAttachment = {
      id: `att-${Date.now()}`,
      nom: file.name,
      taille: `${(file.size / 1024).toFixed(0)} Ko`,
      type: isImg ? 'IMAGE' : file.name.endsWith('.pdf') ? 'PDF' : 'DOC'
    };

    setPendingAttachments(prev => [...prev, newAttach]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Réponses rapides modèles
  const quickChips = [
    { label: 'Validation requise', text: 'Bonjour, merci de valider cette demande dès que possible.' },
    { label: 'Coulage CTC', text: 'Avis favorable CTC obtenu, autorisation de coulage accordée.' },
    { label: 'Livraison matériaux', text: 'Les matériaux prévus sont bien arrivés sur le chantier.' },
    { label: 'Situation de travaux', text: 'Situation de travaux transmise pour visa technique et financier.' }
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-100 overflow-hidden text-xs">
      {/* ======================================================== */}
      {/* 1. PANNEAU GAUCHE : LISTE DES CONVERSATIONS & CANAUX     */}
      {/* ======================================================== */}
      <div className="w-80 sm:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Header Panneau */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                <MessageSquareText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm tracking-tight">Messagerie & Canaux</h2>
                <p className="text-[10px] text-slate-400">Échanges directs, chantiers & groupes</p>
              </div>
            </div>

            {/* Bouton Créer un Groupe */}
            <button
              onClick={() => {
                setIsCreateGroupOpen(true);
                setSelectedUserIds([]);
                setGroupError(null);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition hover:scale-102 active:scale-98"
              title="Créer un groupe de discussion et choisir les participants"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-bold">Nouveau Groupe</span>
            </button>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher une discussion, un chantier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-emerald-500"
            />
          </div>

          {/* Filtres par type */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px]">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors shrink-0 ${
                filterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous ({conversations.length})
            </button>
            <button
              onClick={() => setFilterType('CHANTIER')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 shrink-0 ${
                filterType === 'CHANTIER' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <HardHat className="w-3 h-3" />
              <span>Chantiers</span>
            </button>
            <button
              onClick={() => setFilterType('GROUPE')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 shrink-0 ${
                filterType === 'GROUPE' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Groupes ({conversations.filter(c => c.type === 'GROUPE').length})</span>
            </button>
            <button
              onClick={() => setFilterType('DIRECT')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 shrink-0 ${
                filterType === 'DIRECT' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Privés</span>
            </button>
          </div>
        </div>

        {/* Liste défilable des conversations */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Aucune conversation trouvée.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConversation?.id;
              const hasUnread = conv.non_lus > 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                    isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Avatar Icon */}
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                      conv.type === 'GENERAL'
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xs'
                        : conv.type === 'CHANTIER'
                        ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-xs'
                        : conv.type === 'GROUPE'
                        ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xs'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xs'
                    }`}>
                      {conv.type === 'GENERAL' ? (
                        <Building className="w-5 h-5" />
                      ) : conv.type === 'CHANTIER' ? (
                        <HardHat className="w-5 h-5" />
                      ) : conv.type === 'GROUPE' ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        <span>{conv.avatar_initials}</span>
                      )}
                    </div>
                    {conv.type === 'DIRECT' && conv.is_online && (
                      <span className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full absolute -bottom-0.5 -right-0.5" />
                    )}
                  </div>

                  {/* Infos & Dernier message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                        <span className="truncate">{conv.titre}</span>
                        {conv.type === 'GROUPE' ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> Groupe
                          </span>
                        ) : conv.badge_role ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {conv.badge_role}
                          </span>
                        ) : null}
                      </div>
                      {conv.dernier_message && (
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(conv.dernier_message.created_at).toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[11px] truncate ${
                        hasUnread ? 'font-bold text-slate-900' : 'text-slate-500'
                      }`}>
                        {conv.dernier_message
                          ? `${conv.dernier_message.expediteur_id === currentUser?.id ? 'Vous: ' : ''}${conv.dernier_message.contenu}`
                          : conv.sous_titre}
                      </p>
                      {hasUnread && (
                        <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shrink-0 animate-pulse">
                          {conv.non_lus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PANNEAU CENTRAL : FLUX DE DISCUSSION EN DIRECT        */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
        {/* Top Bar Discussion */}
        <div className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              activeConversation?.type === 'GENERAL'
                ? 'bg-indigo-600 text-white'
                : activeConversation?.type === 'CHANTIER'
                ? 'bg-amber-600 text-white'
                : activeConversation?.type === 'GROUPE'
                ? 'bg-purple-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {activeConversation?.type === 'GENERAL' ? (
                <Building className="w-5 h-5" />
              ) : activeConversation?.type === 'CHANTIER' ? (
                <HardHat className="w-5 h-5" />
              ) : activeConversation?.type === 'GROUPE' ? (
                <Users className="w-5 h-5" />
              ) : (
                <span>{activeConversation?.avatar_initials}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm truncate">{activeConversation?.titre}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  activeConversation?.type === 'GENERAL'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : activeConversation?.type === 'CHANTIER'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : activeConversation?.type === 'GROUPE'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {activeConversation?.type === 'GENERAL'
                    ? 'Canal Siège'
                    : activeConversation?.type === 'CHANTIER'
                    ? 'Canal Chantier'
                    : activeConversation?.type === 'GROUPE'
                    ? 'Groupe d\'Équipe'
                    : 'Discussion Privée'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{activeConversation?.sous_titre}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeConversation?.type === 'GROUPE' && activeConversation.group_info && (
              <button
                onClick={() => setIsViewMembersModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs flex items-center gap-1.5 transition"
                title="Consulter et gérer les participants du groupe"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{activeConversation.group_info.participants_ids?.length || 0} Membres</span>
              </button>
            )}

            <button
              onClick={() => setShowDetailsPane(!showDetailsPane)}
              className={`p-2 rounded-lg border text-slate-600 transition-colors ${
                showDetailsPane ? 'bg-slate-100 border-slate-300 text-slate-900' : 'border-slate-200 hover:bg-slate-50'
              }`}
              title="Afficher/Masquer les détails du contact et pièces jointes"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Zone des messages défilable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-xs">
                <MessageSquareText className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Démarrez la conversation</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {activeConversation?.type === 'CHANTIER'
                    ? `Ce canal regroupe les échanges opérationnels pour "${activeConversation.titre}". Partagez une consigne, une photo ou liez un document.`
                    : activeConversation?.type === 'GENERAL'
                    ? "Fil d'annonces de l'entreprise. Tous les collaborateurs ont accès à cet espace."
                    : `Discutez en direct avec ${activeConversation?.titre}. Vos échanges restent privés et sécurisés.`}
                </p>
              </div>
            </div>
          ) : (
            activeMessages.map((msg, index) => {
              const isMine = msg.expediteur_id === currentUser?.id;

              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-700">{msg.expediteur_nom}</span>
                    {msg.expediteur_role && (
                      <span className="text-[9px] text-slate-400 font-normal">({msg.expediteur_role})</span>
                    )}
                    <span>•</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-xl rounded-2xl px-4 py-2.5 text-xs shadow-xs space-y-2 ${
                      isMine
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {/* Carte contexte liée (DA, CTC, Situation...) */}
                    {msg.reference_contexte && (
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                        isMine
                          ? 'bg-emerald-700/60 border-emerald-500/50 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}>
                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                            Document Lié : {msg.reference_contexte.type}
                          </div>
                          <div className="font-semibold text-xs truncate">{msg.reference_contexte.label}</div>
                          {msg.reference_contexte.montant_ou_statut && (
                            <div className="text-[10px] font-mono opacity-90">{msg.reference_contexte.montant_ou_statut}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contenu textuel */}
                    <p className="leading-relaxed whitespace-pre-wrap select-text">{msg.contenu}</p>

                    {/* Pièces jointes */}
                    {msg.pieces_jointes && msg.pieces_jointes.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        {msg.pieces_jointes.map((att, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-2 p-2 rounded-lg text-[11px] border ${
                              isMine ? 'bg-emerald-700/70 border-emerald-500/40 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            {att.type === 'IMAGE' ? (
                              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="font-medium truncate flex-1">{att.nom}</span>
                            {att.taille && <span className="opacity-75 text-[10px] font-mono shrink-0">{att.taille}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isMine && (
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 pr-1">
                      <CheckCheck className={`w-3.5 h-3.5 ${msg.lu ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{msg.lu ? 'Lu' : 'Envoyé'}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie inférieure */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2 shrink-0">
          {/* Quick reply templates */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-[10px] font-semibold text-slate-400 mr-1 shrink-0">Modèles :</span>
            {quickChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => setInputText(prev => prev ? `${prev} ${chip.text}` : chip.text)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors whitespace-nowrap shrink-0 border border-slate-200"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Prévisualisation des pièces jointes ou document lié */}
          {(pendingAttachments.length > 0 || selectedContextRef) && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-2 text-xs">
              {selectedContextRef && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-medium">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Lié: {selectedContextRef.label}</span>
                  <button onClick={() => setSelectedContextRef(null)} className="hover:text-blue-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {pendingAttachments.map((att, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-medium">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="truncate max-w-xs">{att.nom}</span>
                  <button onClick={() => setPendingAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-emerald-950">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Formulaire de saisie principal */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shrink-0"
              title="Joindre une photo ou un fichier de chantier"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                selectedContextRef ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Lier une Demande d'Achat, un PV CTC ou une Situation"
            >
              <LinkIcon className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Écrire un message dans ${activeConversation?.titre}... (Entrée pour envoyer)`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-emerald-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim() && pendingAttachments.length === 0 && !selectedContextRef}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Envoyer</span>
            </button>
          </form>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. PANNEAU DROIT COLLAPSIBLE : DÉTAILS DU CONTACT/CANAL  */}
      {/* ======================================================== */}
      {showDetailsPane && (
        <div className="w-72 bg-white border-l border-slate-200 p-5 hidden xl:flex flex-col space-y-6 shrink-0 overflow-y-auto">
          <div className="text-center space-y-2 pb-4 border-b border-slate-100">
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
              activeConversation?.type === 'GENERAL'
                ? 'bg-indigo-600 text-white'
                : activeConversation?.type === 'CHANTIER'
                ? 'bg-amber-600 text-white'
                : activeConversation?.type === 'GROUPE'
                ? 'bg-purple-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {activeConversation?.type === 'GENERAL' ? (
                <Building className="w-8 h-8" />
              ) : activeConversation?.type === 'CHANTIER' ? (
                <HardHat className="w-8 h-8" />
              ) : activeConversation?.type === 'GROUPE' ? (
                <Users className="w-8 h-8" />
              ) : (
                <span>{activeConversation?.avatar_initials}</span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-sm leading-tight">{activeConversation?.titre}</h3>
            <p className="text-[11px] text-slate-500">{activeConversation?.sous_titre}</p>
          </div>

          {/* Informations Groupe */}
          {activeConversation?.type === 'GROUPE' && activeConversation.group_info && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Membres ({activeConversation.group_info.participants_ids?.length || 0})
                </h4>
                <button
                  onClick={() => setIsViewMembersModalOpen(true)}
                  className="text-[11px] text-purple-600 hover:text-purple-700 font-bold hover:underline"
                >
                  Voir tous
                </button>
              </div>

              {activeConversation.group_info.description && (
                <p className="text-slate-600 p-2.5 rounded-lg bg-slate-50 border border-slate-100 leading-relaxed text-[11px]">
                  {activeConversation.group_info.description}
                </p>
              )}

              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {utilisateurs
                  .filter(u => activeConversation.group_info?.participants_ids?.includes(u.id))
                  .map(member => (
                    <div key={member.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {member.prenom?.[0]}{member.nom?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{member.prenom} {member.nom}</p>
                          <p className="text-[10px] text-slate-500 truncate">{member.poste}</p>
                        </div>
                      </div>
                      {member.id === activeConversation.group_info?.createur_id && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold shrink-0">
                          Créateur
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Informations spécifiques selon le type */}
          {activeConversation?.type === 'DIRECT' && activeConversation.target_user && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Fiche Collaborateur</h4>
              <div className="space-y-2 text-slate-600">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate">{activeConversation.target_user.poste || 'Collaborateur BatiProm'}</span>
                </div>
                {activeConversation.target_user.telephone && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 font-mono">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>{activeConversation.target_user.telephone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 font-mono">
                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                  <span className="truncate">{activeConversation.target_user.email}</span>
                </div>
              </div>
            </div>
          )}

          {activeConversation?.type === 'CHANTIER' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Actions Rapides Chantier</h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => setActiveNav('suivi-travaux')}
                  className="w-full py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium flex items-center justify-between text-left transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HardHat className="w-3.5 h-3.5" />
                    <span>Suivi des travaux & PV</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveNav('approvisionnements')}
                  className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium flex items-center justify-between text-left transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Demandes d'achats (DA)</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Fichiers récents partagés dans la discussion */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
              <span>Fichiers Partagés</span>
              <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            </h4>
            {activeMessages.flatMap(m => m.pieces_jointes || []).length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">Aucune pièce jointe dans ce fil.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {activeMessages.flatMap(m => m.pieces_jointes || []).map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate flex-1 font-medium text-slate-700">{file.nom}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{file.taille}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL : SÉLECTIONNER UN DOCUMENT À LIER AU MESSAGE      */}
      {/* ======================================================== */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Lier un document opérationnel</h3>
              </div>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Sélectionnez une Demande d'Achat (DA), un Contrôle CTC ou une Situation de travaux pour l'attacher directement à votre message.
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {/* 1. Demandes d'Achat */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Demandes d'Achat (DA)</span>
                {demandesAchat.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Aucune DA active.</p>
                ) : (
                  demandesAchat.slice(0, 5).map(da => (
                    <div
                      key={da.id}
                      onClick={() => {
                        setSelectedContextRef({
                          type: 'DEMANDE_ACHAT',
                          id: da.id,
                          label: `${da.numero_da} : ${da.designation_produit}`,
                          montant_ou_statut: `${da.statut} · ${da.quantite_demandee} ${da.unite_mesure}`
                        });
                        setIsLinkModalOpen(false);
                      }}
                      className="p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="font-semibold text-slate-800">{da.numero_da} : {da.designation_produit}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        {da.statut}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* 2. Contrôles CTC */}
              <div className="space-y-1 pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contrôles CTC & Visas</span>
                {controlesCTC.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Aucun PV CTC enregistré.</p>
                ) : (
                  controlesCTC.slice(0, 5).map(ctc => (
                    <div
                      key={ctc.id}
                      onClick={() => {
                        setSelectedContextRef({
                          type: 'CONTROLE_CTC',
                          id: ctc.id,
                          label: `PV CTC ${ctc.numero_pv} : ${ctc.ouvrage_concerne}`,
                          montant_ou_statut: `Avis: ${ctc.avis}`
                        });
                        setIsLinkModalOpen(false);
                      }}
                      className="p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="font-semibold text-slate-800">PV {ctc.numero_pv}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                        {ctc.avis}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL : CRÉATION D'UN NOUVEAU GROUPE DE DISCUSSION      */}
      {/* ======================================================== */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Créer un Groupe de Discussion</h3>
                  <p className="text-[11px] text-slate-500">Choisissez les collaborateurs avec qui échanger en équipe</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateGroupOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {groupError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{groupError}</span>
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Nom & Description */}
              <div className="space-y-3 shrink-0">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom du Groupe <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Commission Achats, Cellule Contrôle CTC, Comité Technique Oran..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-purple-500 focus:bg-white bg-slate-50 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description ou Sujet de la discussion <span className="text-slate-400 font-normal">(Optionnel)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Suivi des validations des commandes et des plannings de coulage"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-purple-500 focus:bg-white bg-slate-50"
                  />
                </div>
              </div>

              {/* Sélection des Collaborateurs */}
              <div className="flex-1 flex flex-col min-h-0 border-t border-slate-100 pt-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Sélectionnez les personnes avec qui discuter <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {selectedUserIds.length} sélectionné{selectedUserIds.length > 1 ? 's' : ''} (+ Vous)
                  </span>
                </div>

                {/* Barre de recherche + filtres */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filtrer par nom, prénom, rôle..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-purple-500"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setParticipantFilter('ALL')}
                      className={`px-2 py-1 rounded-md font-medium transition ${
                        participantFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipantFilter('CENTRAL')}
                      className={`px-2 py-1 rounded-md font-medium transition ${
                        participantFilter === 'CENTRAL' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      Siège
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipantFilter('CHANTIER')}
                      className={`px-2 py-1 rounded-md font-medium transition ${
                        participantFilter === 'CHANTIER' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      Chantiers
                    </button>
                  </div>
                </div>

                {/* Bouton Tout sélectionner / Désélectionner */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const filtered = utilisateurs.filter(u => {
                        if (u.id === currentUser?.id) return false;
                        if (participantFilter !== 'ALL' && u.type !== participantFilter) return false;
                        if (participantSearch) {
                          const q = participantSearch.toLowerCase();
                          return `${u.prenom} ${u.nom}`.toLowerCase().includes(q) || (u.poste || '').toLowerCase().includes(q);
                        }
                        return true;
                      });
                      handleSelectAllUsers(filtered);
                    }}
                    className="text-[11px] text-purple-700 hover:text-purple-800 font-semibold cursor-pointer"
                  >
                    Tout sélectionner / Désélectionner
                  </button>
                </div>

                {/* Liste des personnes avec cases à cocher */}
                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-1 bg-slate-50/50">
                  {utilisateurs
                    .filter(u => {
                      if (u.id === currentUser?.id) return false;
                      if (participantFilter !== 'ALL' && u.type !== participantFilter) return false;
                      if (participantSearch) {
                        const q = participantSearch.toLowerCase();
                        return `${u.prenom} ${u.nom}`.toLowerCase().includes(q) || (u.poste || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                      }
                      return true;
                    })
                    .map(u => {
                      const isSelected = selectedUserIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleSelectUser(u.id)}
                          className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition ${
                            isSelected ? 'bg-purple-50/90 border border-purple-200' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                              isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {u.prenom?.[0]}{u.nom?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{u.prenom} {u.nom}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <span>{u.poste || 'Collaborateur'}</span>
                                <span>·</span>
                                <span className={u.type === 'CENTRAL' ? 'text-indigo-600 font-semibold' : 'text-amber-600 font-semibold'}>
                                  {u.type === 'CENTRAL' ? 'Siège' : 'Chantier'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Footer Modal Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingGroup || !newGroupName.trim() || selectedUserIds.length === 0}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {isSubmittingGroup ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Création du groupe...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Créer le Groupe ({selectedUserIds.length + 1} membres)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL : MEMBRES DU GROUPE ACTIF                          */}
      {/* ======================================================== */}
      {isViewMembersModalOpen && activeConversation?.type === 'GROUPE' && activeConversation.group_info && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Membres du Groupe</h3>
                  <p className="text-[10px] text-slate-500">{activeConversation.titre}</p>
                </div>
              </div>
              <button
                onClick={() => setIsViewMembersModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {utilisateurs
                .filter(u => activeConversation.group_info?.participants_ids?.includes(u.id))
                .map(member => (
                  <div key={member.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                        {member.prenom?.[0]}{member.nom?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{member.prenom} {member.nom}</p>
                        <p className="text-[10px] text-slate-500">{member.poste}</p>
                        {member.telephone && (
                          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" /> {member.telephone}
                          </p>
                        )}
                      </div>
                    </div>
                    {member.id === activeConversation.group_info?.createur_id ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                        Créateur
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-medium">
                        Membre
                      </span>
                    )}
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsViewMembersModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
