import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { NAV, BLUE, BrandCard, BrandCardHeader } from '@/lib/brand';
import { UserCircle2, Camera, Link2, ImageIcon, Loader2, Save } from 'lucide-react';

const CoauthorIdentityPage = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [bio, setBio]             = useState(user?.bio || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [whatsappDdi, setWhatsappDdi] = useState(user?.whatsapp?.split(' ')[0] || '+55');
  const [whatsapp, setWhatsapp]       = useState(user?.whatsapp?.split(' ').slice(1).join('') || '');
  const [chapterPhoto, setChapterPhoto] = useState(user?.chapter_photo_url || '');
  const [saving, setSaving]             = useState(false);
  const [uploading, setUploading]       = useState(false);
  const photoRef = useRef(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles')
        .update({ bio, instagram, whatsapp: `${whatsappDdi} ${whatsapp}`, chapter_photo_url: chapterPhoto })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Identidade salva!', description: 'Suas informações foram atualizadas.' });
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const form = new FormData();
      form.append('file', file);
      form.append('name', user.name || user.email || user.id);
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-r2`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload falhou');
      setChapterPhoto(result.url);
      await supabase.from('profiles').update({ chapter_photo_url: result.url }).eq('id', user.id);
      await refreshProfile();
      toast({ title: 'Foto enviada!' });
    } catch (err) {
      toast({ title: 'Erro ao enviar foto', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const inputStyle = { border: `1.5px solid ${NAV}18`, color: NAV, outline: 'none' };
  const onFocus = e => { e.target.style.borderColor = '#8B5CF6'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; };
  const onBlur  = e => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <Helmet><title>Mídias do Capítulo — Novos Autores do Brasil</title></Helmet>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: NAV, fontFamily: 'Poppins, sans-serif' }}>Mídias do Capítulo</h1>
        <p className="text-sm mt-1" style={{ color: `${NAV}85` }}>Informações que aparecem na capa do capítulo.</p>
      </div>

      <BrandCard>
        <BrandCardHeader icon={UserCircle2} iconColor="#8B5CF6" accentColor="#8B5CF6" title="Mídias do Capítulo"
          extra={
            <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
              style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}>Capa do Capítulo</span>
          }
        />
        <div className="px-6 py-6 space-y-6">

          {/* Foto */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {chapterPhoto
                ? <img src={chapterPhoto} alt="Foto" className="w-24 h-24 rounded-xl object-cover" style={{ border: '2px solid rgba(139,92,246,0.2)' }} />
                : <div className="w-24 h-24 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.08)', border: '2px dashed rgba(139,92,246,0.3)' }}>
                    <ImageIcon className="w-8 h-8" style={{ color: 'rgba(139,92,246,0.4)' }} />
                  </div>
              }
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#8B5CF6' }} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm" style={{ color: NAV }}>Foto para o capítulo</p>
              <p className="text-xs" style={{ color: `${NAV}72` }}>Será usada na capa do seu capítulo junto ao seu texto.</p>
              <input ref={photoRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoChange} />
              <button
                onClick={() => photoRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
              >
                <Camera className="w-3.5 h-3.5" />
                {uploading ? 'Enviando...' : chapterPhoto ? 'Alterar foto' : 'Enviar foto'}
              </button>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}72` }}>Minicurrículo — Capa do Capítulo</label>
            <textarea
              rows={5}
              placeholder="Escreva uma breve apresentação que aparecerá na capa do capítulo ao lado do seu texto (máx. 350 caracteres)..."
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 350))}
              className="w-full resize-none rounded-xl px-3 py-2.5 text-sm"
              style={inputStyle}
              onFocus={onFocus} onBlur={onBlur}
            />
            <p className="text-right text-[10px]" style={{ color: `${NAV}72` }}>{bio.length}/350</p>
          </div>

          {/* Redes sociais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}72` }}>Instagram</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${NAV}55` }} />
                <input type="text" placeholder="@seuusuario" value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm"
                  style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: `${NAV}72` }}>WhatsApp</label>
              <div className="flex rounded-xl overflow-hidden" style={{ border: `1.5px solid ${NAV}18` }}>
                <select
                  value={whatsappDdi}
                  onChange={e => setWhatsappDdi(e.target.value)}
                  className="text-sm font-semibold px-2 py-2.5 outline-none cursor-pointer shrink-0"
                  style={{ background: `${NAV}06`, borderRight: `1px solid ${NAV}18`, color: NAV, maxWidth: 90 }}
                >
                  <option value="+55">🇧🇷 +55</option>
                  <option value="+351">🇵🇹 +351</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+49">🇩🇪 +49</option>
                  <option value="+39">🇮🇹 +39</option>
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+56">🇨🇱 +56</option>
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+598">🇺🇾 +598</option>
                  <option value="+595">🇵🇾 +595</option>
                  <option value="+591">🇧🇴 +591</option>
                  <option value="+593">🇪🇨 +593</option>
                  <option value="+51">🇵🇪 +51</option>
                  <option value="+58">🇻🇪 +58</option>
                </select>
                <input
                  type="tel"
                  placeholder="11999887766"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 13))}
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none"
                  style={{ color: NAV }}
                  onFocus={e => { e.currentTarget.parentElement.style.borderColor = '#8B5CF6'; e.currentTarget.parentElement.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                  onBlur={e => { e.currentTarget.parentElement.style.borderColor = `${NAV}18`; e.currentTarget.parentElement.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#8B5CF6', color: '#fff', opacity: saving ? 0.7 : 1 }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#7C3AED'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#8B5CF6'; }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar Identidade'}
          </button>
        </div>
      </BrandCard>
    </div>
  );
};

export default CoauthorIdentityPage;
