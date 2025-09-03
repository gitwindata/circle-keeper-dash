import { useState, useEffect } from 'react';
import { PersonalNote, Member, PersonalNoteFormData } from '../types';
import { supabase } from '../lib/supabase';
import { hairstylistHelpers } from '../lib/supabase-helpers';
import { useAuth } from '../hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StickyNote, Plus, Edit3, Trash2, Eye, EyeOff, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PersonalNotesManagerProps {
  memberId?: string;
  member?: Member;
  hairstylistId?: string;
  className?: string;
}

const PersonalNotesManager = ({ memberId, member, hairstylistId, className = '' }: PersonalNotesManagerProps) => {
  const { userProfile } = useAuth();
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [assignedMembers, setAssignedMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);
  const [formData, setFormData] = useState<PersonalNoteFormData>({
    member_id: memberId || '',
    note: '',
    is_private: true
  });

  useEffect(() => {
    if (memberId || member?.id) {
      loadNotes();
    } else if (hairstylistId || userProfile?.id) {
      // Load all notes for hairstylist and assigned members when no specific member
      loadNotesAndMembers();
    }
  }, [memberId, member?.id, hairstylistId, userProfile?.id]);

  const loadNotesAndMembers = async () => {
    try {
      setLoading(true);
      const targetHairstylistId = hairstylistId || userProfile?.id;
      
      if (!targetHairstylistId) return;

      // Load assigned members and notes in parallel
      const [members, notesResult] = await Promise.all([
        hairstylistHelpers.getAssignedMembers(targetHairstylistId),
        supabase
          .from('personal_notes')
          .select(`
            *,
            member:members(
              *,
              user_profile:user_profiles(*)
            )
          `)
          .eq('hairstylist_id', targetHairstylistId)
          .order('created_at', { ascending: false })
      ]);

      if (notesResult.error) throw notesResult.error;

      setAssignedMembers(members);
      setNotes(notesResult.data || []);

    } catch (error: any) {
      console.error('Failed to load notes and members:', error);
      toast.error('Failed to load notes and members');
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      const targetMemberId = memberId || member?.id;
      const targetHairstylistId = hairstylistId || userProfile?.id;
      
      if (!targetHairstylistId) return;

      let query = supabase
        .from('personal_notes')
        .select(`
          *,
          member:members(
            *,
            user_profile:user_profiles(*)
          )
        `)
        .eq('hairstylist_id', targetHairstylistId)
        .order('created_at', { ascending: false });

      // If specific member ID provided, filter by it
      if (targetMemberId) {
        query = query.eq('member_id', targetMemberId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      console.error('Failed to load notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const openNoteDialog = (note?: PersonalNote) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        member_id: note.member_id,
        note: note.note,
        is_private: note.is_private
      });
    } else {
      setEditingNote(null);
      setFormData({
        member_id: memberId || member?.id || '',
        note: '',
        is_private: true
      });
    }
    setIsDialogOpen(true);
  };

  const saveNote = async () => {
    if (!formData.note.trim()) {
      toast.error('Please enter a note');
      return;
    }

    if (!memberInfo && !editingNote && !formData.member_id) {
      toast.error('Please select a member');
      return;
    }

    const targetHairstylistId = hairstylistId || userProfile?.id;
    if (!targetHairstylistId) {
      toast.error('Hairstylist ID not found');
      return;
    }

    try {
      setSaving(true);
      
      if (editingNote) {
        // Update existing note
        const { error } = await supabase
          .from('personal_notes')
          .update({
            note: formData.note,
            is_private: formData.is_private,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNote.id);

        if (error) throw error;
        toast.success('Note updated successfully');
      } else {
        // Create new note
        const { error } = await supabase
          .from('personal_notes')
          .insert({
            hairstylist_id: targetHairstylistId,
            member_id: formData.member_id,
            note: formData.note,
            is_private: formData.is_private
          });

        if (error) throw error;
        toast.success('Note added successfully');
      }

      setIsDialogOpen(false);
      // Reload notes - choose the appropriate method
      if (memberInfo || editingNote) {
        await loadNotes();
      } else {
        await loadNotesAndMembers();
      }
    } catch (error: any) {
      console.error('Failed to save note:', error);
      toast.error(error.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('personal_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      
      toast.success('Note deleted successfully');
      // Reload notes - choose the appropriate method
      if (memberInfo) {
        await loadNotes();
      } else {
        await loadNotesAndMembers();
      }
    } catch (error: any) {
      console.error('Failed to delete note:', error);
      toast.error('Failed to delete note');
    }
  };

  const getMemberInfo = () => {
    if (member) return member;
    if (notes.length > 0 && notes[0].member) {
      return notes[0].member;
    }
    return null;
  };

  const memberInfo = getMemberInfo();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Personal Notes</h3>
          {memberInfo && (
            <Badge variant="outline">
              {memberInfo.user_profile?.full_name}
            </Badge>
          )}
          {!memberInfo && !memberId && !member?.id && (
            <Badge variant="secondary">
              All Members
            </Badge>
          )}
        </div>
        
        <Button
          onClick={() => openNoteDialog()}
          size="sm"
          disabled={!hairstylistId && !userProfile?.id}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <StickyNote className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Notes Yet</h3>
            <p className="text-gray-600 mb-4">
              {memberInfo 
                ? "Add personal notes about this member's preferences, special requirements, or important details."
                : "Add personal notes about your members' preferences, special requirements, or important details."
              }
            </p>
            <Button
              onClick={() => openNoteDialog()}
              disabled={!hairstylistId && !userProfile?.id}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Show member info if this is a general view (no specific member) */}
                    {!memberInfo && note.member && (
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={note.member.user_profile?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {note.member.user_profile?.full_name?.[0] || 'M'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-blue-600">
                          {note.member.user_profile?.full_name}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(note.created_at), 'MMM d, yyyy at h:mm a')}
                      </div>
                      
                      <Badge variant={note.is_private ? 'secondary' : 'outline'} className="text-xs">
                        {note.is_private ? (
                          <><EyeOff className="h-3 w-3 mr-1" />Private</>
                        ) : (
                          <><Eye className="h-3 w-3 mr-1" />Shared</>
                        )}
                      </Badge>
                      
                      {note.updated_at !== note.created_at && (
                        <Badge variant="outline" className="text-xs">
                          Edited
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.note}</p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openNoteDialog(note)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Note Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              {editingNote ? 'Edit Note' : 'Add Note'}
              {memberInfo && (
                <Badge variant="outline">
                  {memberInfo.user_profile?.full_name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Member Info (if available) */}
            {memberInfo && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={memberInfo.user_profile?.avatar_url} />
                      <AvatarFallback>
                        {memberInfo.user_profile?.full_name?.[0] || 'M'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{memberInfo.user_profile?.full_name}</p>
                      <p className="text-xs text-gray-600">
                        {memberInfo.total_visits || 0} visits |
                        Member since {format(new Date(memberInfo.join_date), 'MMM yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Member Selection (when no specific member) */}
            {!memberInfo && !editingNote && assignedMembers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="member-select">Select Member *</Label>
                <Select
                  value={formData.member_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, member_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member to add a note for..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={member.user_profile?.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {member.user_profile?.full_name?.[0] || 'M'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.user_profile?.full_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Note Content */}
            <div className="space-y-2">
              <Label htmlFor="note">Note Content *</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Enter your note about this member..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Include preferences, allergies, special requests, hair type, or any important details.
              </p>
            </div>

            {/* Privacy Setting */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {formData.is_private ? (
                  <EyeOff className="h-4 w-4 text-gray-600" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-600" />
                )}
                <div>
                  <Label htmlFor="privacy" className="text-sm font-medium">
                    Private Note
                  </Label>
                  <p className="text-xs text-gray-600">
                    {formData.is_private 
                      ? 'Only you can see this note'
                      : 'Other hairstylists can see this note'
                    }
                  </p>
                </div>
              </div>
              
              <Switch
                id="privacy"
                checked={formData.is_private}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_private: checked }))}
              />
            </div>

            {/* Info Alert */}
            <Alert>
              <AlertDescription className="text-xs">
                Personal notes help you remember important details about each member's preferences and history.
                Mark as private if the information is sensitive.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={saveNote}
                disabled={saving || !formData.note.trim() || (!memberInfo && !editingNote && !formData.member_id)}
              >
                {saving ? 'Saving...' : editingNote ? 'Update Note' : 'Add Note'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonalNotesManager;