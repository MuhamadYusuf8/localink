'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, Pin, Lock, CheckCircle, Heart, MessageSquare, Trash2, Edit2, Award, Share2, AlertCircle, Send, ArrowLeft } from 'lucide-react'
import { useForumThread, useForumReplies, useReplyLike } from '@/lib/forum/hooks'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAuthStore } from '@/lib/store/authStore'
import { formatRelativeTime, roleStyles, categoryStyles } from '@/lib/forum/utils'
import type { ForumReply, AuthorRole } from '@/lib/forum/types'

// ─── Design Tokens (Premium Light Theme) ──────────────────
const C = {
  bg: '#F8FAFC',          // Slate 50
  card: '#FFFFFF',        // Putih Bersih
  input: '#F1F5F9',       // Slate 100
  border: '#E2E8F0',      // Slate 200
  borderActive: '#059669',// Emerald 600
  accent: '#059669',      // Emerald 600
  accentGlow: 'rgba(5, 150, 105, 0.08)',
  accentBorder: 'rgba(5, 150, 105, 0.25)',
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#334155',// Slate 700
  textMuted: '#64748B',   // Slate 500
  textPlaceholder: '#94A3B8', // Slate 400
}

function Avatar({initials,role,size=40}:{initials:string;role:AuthorRole;size?:number}){
  return <div style={{width:size,height:size,borderRadius:'12px',background:roleStyles[role].gradient,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.35+'px',fontWeight:700,color:'#fff',flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>{initials}</div>
}

function RoleBadge({role}:{role:AuthorRole}){
  const s=roleStyles[role]
  return <span style={{background:s.badgeBg,color:s.badgeColor,border:`1px solid ${s.badgeBorder}`,borderRadius:'9999px',padding:'2px 10px',fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.02em'}}>{s.label}</span>
}

function Skeleton(){
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:'16px',padding:'20px',marginBottom:'16px',boxShadow:'0 4px 20px rgba(0, 0, 0, 0.02)'}}>
    {[100,70,50].map((w,i)=><div key={i} style={{height:i===0?'16px':'11px',width:`${w}%`,background:'#F1F5F9',borderRadius:'6px',marginBottom:'10px'}}/>)}
  </div>
}

// ─── Like Button ─────────────────────────────────────────
function LikeButton({reply,onUpdate}:{reply:ForumReply;onUpdate:(liked:boolean,count:number)=>void}){
  const {liked,count,isLoading,toggleLike}=useReplyLike(reply.id,reply.liked_by_user??false,reply.like_count,onUpdate)
  return <button onClick={toggleLike} disabled={isLoading} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'8px',border:`1px solid ${liked?C.accentBorder:C.border}`,background:liked?C.accentGlow:C.card,color:liked?C.accent:C.textMuted,fontSize:'0.8rem',cursor:'pointer',transition:'all 0.15s',fontWeight:500,boxShadow:'0 1px 2px rgba(0,0,0,0.02)'}}>
    <Heart size={14} fill={liked?C.accent:'none'} color={liked?C.accent:undefined}/>{count}
  </button>
}

// ─── Reply Card ───────────────────────────────────────────
function ReplyCard({reply,threadAuthorId,threadId,isLocked,hasSolution,onReply,onMarkSolution,onDelete,isNested=false}:{reply:ForumReply;threadAuthorId:string;threadId:string;isLocked:boolean;hasSolution:boolean;onReply:(r:ForumReply)=>void;onMarkSolution:(id:string)=>void;onDelete:(id:string)=>void;isNested?:boolean}){
  const {user,isAuthenticated}=useAuth()
  const [localLiked,setLocalLiked]=useState(reply.liked_by_user??false)
  const [localCount,setLocalCount]=useState(reply.like_count)

  const isAuthor=user?.id===reply.author_id
  const isAdmin=user?.role==='admin'
  const isThreadAuthor=user?.id===threadAuthorId
  const canMarkSolution=isThreadAuthor&&!hasSolution&&!isLocked&&!reply.is_solution

  return <div style={{marginLeft:isNested?'56px':0,animation:'fadeInUp 0.3s ease'}}>
    <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    <div style={{background:reply.is_solution?'rgba(5, 150, 105, 0.03)':reply.is_official?'#EFF6FF':C.card,border:`1px solid ${reply.is_solution?C.accentBorder:reply.is_official?'#BFDBFE':C.border}`,borderRadius:'16px',padding:'20px',marginBottom:'16px',borderLeft:isNested?`3px solid ${C.borderActive}`:undefined,boxShadow:'0 2px 10px rgba(0,0,0,0.02)'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',gap:'16px',marginBottom:'16px'}}>
        <Avatar initials={reply.author_avatar} role={reply.author_role}/>
        <div style={{flex:1}}>
          <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
            <span style={{color:C.textPrimary,fontWeight:700,fontSize:'0.95rem'}}>{reply.author_name}</span>
            <RoleBadge role={reply.author_role}/>
            {reply.is_official&&<span style={{background:'#EFF6FF',color:'#2563EB',border:'1px solid #BFDBFE',borderRadius:'9999px',padding:'2px 10px',fontSize:'0.65rem',fontWeight:700}}>✓ RESMI ADMIN</span>}
            {reply.is_solution&&<span style={{background:C.accentGlow,color:C.accent,border:`1px solid ${C.accentBorder}`,borderRadius:'9999px',padding:'2px 10px',fontSize:'0.65rem',fontWeight:700}}>✅ SOLUSI</span>}
          </div>
          <span style={{color:C.textPlaceholder,fontSize:'0.8rem'}}>{formatRelativeTime(reply.created_at)}{reply.updated_at!==reply.created_at&&' · diedit'}</span>
        </div>
      </div>
      {/* Body */}
      <p style={{color:C.textSecondary,fontSize:'0.95rem',lineHeight:1.7,margin:'0 0 16px',whiteSpace:'pre-wrap'}}>{reply.body}</p>
      {/* Actions */}
      <div style={{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}}>
        {isAuthenticated&&<LikeButton reply={{...reply,liked_by_user:localLiked,like_count:localCount}} onUpdate={(l,c)=>{setLocalLiked(l);setLocalCount(c)}}/>}
        {isAuthenticated&&!isLocked&&<button onClick={()=>onReply(reply)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'8px',border:`1px solid ${C.border}`,background:C.card,color:C.textSecondary,fontSize:'0.8rem',fontWeight:500,cursor:'pointer',transition:'background 0.2s'}} onMouseOver={e=>e.currentTarget.style.background=C.input} onMouseOut={e=>e.currentTarget.style.background=C.card}><MessageSquare size={14}/>Balas</button>}
        {canMarkSolution&&<button onClick={()=>onMarkSolution(reply.id)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'8px',border:`1px solid ${C.accentBorder}`,background:C.accentGlow,color:C.accent,fontSize:'0.8rem',fontWeight:600,cursor:'pointer'}}><Award size={14}/>Tandai Solusi</button>}
        {(isAuthor||isAdmin)&&<button onClick={()=>onDelete(reply.id)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'8px',border:'1px solid #FECACA',background:'#FEF2F2',color:'#EF4444',fontSize:'0.8rem',fontWeight:500,cursor:'pointer',marginLeft:'auto',transition:'background 0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#FEE2E2'} onMouseOut={e=>e.currentTarget.style.background='#FEF2F2'}><Trash2 size={14}/>Hapus</button>}
      </div>
    </div>
  </div>
}

// ─── Reply Form ───────────────────────────────────────────
function ReplyForm({threadId,replyingTo,onCancel,onSubmit}:{threadId:string;replyingTo:ForumReply|null;onCancel:()=>void;onSubmit:(body:string,parentId?:string)=>Promise<void>}){
  const [body,setBody]=useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const textRef=useRef<HTMLTextAreaElement>(null)

  useEffect(()=>{textRef.current?.focus()},[replyingTo])

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault()
    if(body.trim().length<5){setError('Minimal 5 karakter');return}
    setLoading(true);setError('')
    try{await onSubmit(body.trim(),replyingTo?.id);setBody('')}
    catch(err:unknown){setError(err instanceof Error?err.message:'Gagal mengirim')}
    finally{setLoading(false)}
  }

  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:'16px',padding:'24px',marginTop:'24px',boxShadow:'0 4px 20px rgba(0, 0, 0, 0.02)'}}>
    {replyingTo&&<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',padding:'10px 16px',background:C.accentGlow,border:`1px solid ${C.accentBorder}`,borderRadius:'10px'}}>
      <span style={{color:C.accent,fontSize:'0.85rem',fontWeight:500}}>Membalas <strong>{replyingTo.author_name}</strong></span>
      <button onClick={onCancel} style={{background:C.card,border:`1px solid ${C.accentBorder}`,borderRadius:'6px',padding:'4px 8px',color:C.accent,cursor:'pointer',fontSize:'0.75rem',fontWeight:600}}>Batal</button>
    </div>}
    <form onSubmit={handleSubmit}>
      <textarea
        ref={textRef} value={body} onChange={e=>setBody(e.target.value)}
        placeholder="Tulis balasan Anda... (Ctrl+Enter untuk kirim)"
        onKeyDown={e=>{if(e.ctrlKey&&e.key==='Enter')handleSubmit(e)}}
        style={{width:'100%',background:C.input,border:`1px solid ${error?'#EF4444':C.border}`,borderRadius:'12px',color:C.textPrimary,fontSize:'0.95rem',padding:'16px',outline:'none',resize:'vertical',minHeight:'120px',boxSizing:'border-box',fontFamily:'inherit',transition:'border 0.2s'}}
      />
      {error&&<p style={{color:'#EF4444',fontSize:'0.8rem',margin:'6px 0 0',fontWeight:500}}>{error}</p>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'16px'}}>
        <span style={{color:C.textPlaceholder,fontSize:'0.8rem'}}>{body.length} karakter</span>
        <button type="submit" disabled={loading} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 24px',borderRadius:'10px',border:'none',background:loading?C.border:C.accent,color:loading?C.textMuted:'#FFFFFF',fontWeight:600,fontSize:'0.9rem',cursor:loading?'not-allowed':'pointer',boxShadow:loading?'none':'0 4px 12px rgba(5, 150, 105, 0.2)',transition:'all 0.2s'}}>
          <Send size={16}/>{loading?'Mengirim...':'Kirim Balasan'}
        </button>
      </div>
    </form>
  </div>
}

// ─── Main Page ────────────────────────────────────────────
export default function ThreadDetailPage({params}:{params:{threadId:string}}){
  const {threadId}=params
  const {user,isAuthenticated}=useAuth()
  const {thread,isLoading:threadLoading,error:threadError,updateThread}=useForumThread(threadId)
  const {replies,isLoading:repliesLoading,newRepliesCount,createReply,updateReplyLike,markSolution,clearNewReplies}=useForumReplies(threadId)
  const [replyingTo,setReplyingTo]=useState<ForumReply|null>(null)
  const [toast,setToast]=useState<string|null>(null)

  const showToast=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(null),3000)}

  const handleReply=async(body:string,parentId?:string)=>{
    await createReply({thread_id:threadId,body,parent_reply_id:parentId})
    setReplyingTo(null)
    showToast('Balasan berhasil dikirim!')
  }

  const handleMarkSolution=async(replyId:string)=>{
    try{
      const res=await fetch(`/api/forum/replies/${replyId}/solution`,{
        method:'POST',
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token || ''}` }
      })
      if(!res.ok){const d=await res.json();throw new Error(d.error)}
      markSolution(replyId)
      updateThread({is_resolved:true})
      showToast('Balasan berhasil ditandai sebagai solusi!')
    }catch(err:unknown){showToast(err instanceof Error?err.message:'Gagal')}
  }

  const handleDelete=async(replyId:string)=>{
    if(!confirm('Yakin ingin menghapus balasan ini?'))return
    try{
      const res=await fetch(`/api/forum/replies/${replyId}`,{
        method:'DELETE',
        headers: { 'Authorization': `Bearer ${useAuthStore.getState().token || ''}` }
      })
      if(!res.ok){const d=await res.json();throw new Error(d.error)}
      showToast('Balasan berhasil dihapus!')
    }catch(err:unknown){showToast(err instanceof Error?err.message:'Gagal')}
  }

  const handleShare=()=>{
    navigator.clipboard.writeText(window.location.href)
    showToast('Link berhasil disalin!')
  }

  const handleToggleLock=async()=>{
    if(!thread)return
    const res=await fetch(`/api/forum/threads/${threadId}`,{
      method:'PATCH',
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${useAuthStore.getState().token || ''}`
      },
      body:JSON.stringify({is_locked:!thread.is_locked})
    })
    if(res.ok){const d=await res.json();updateThread({is_locked:d.is_locked});showToast(d.is_locked?'Thread dikunci!':'Thread dibuka!')}
  }

  const handleTogglePin=async()=>{
    if(!thread)return
    const res=await fetch(`/api/forum/threads/${threadId}`,{
      method:'PATCH',
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${useAuthStore.getState().token || ''}`
      },
      body:JSON.stringify({is_pinned:!thread.is_pinned})
    })
    if(res.ok){const d=await res.json();updateThread({is_pinned:d.is_pinned});showToast(d.is_pinned?'Thread disematkan!':'Sematan dilepas!')}
  }

  const hasSolution=replies.some(r=>r.is_solution)
  const solutionReply=replies.find(r=>r.is_solution)
  const isAdmin=user?.role==='admin'
  const isThreadAuthor=user?.id===thread?.author_id

  // Group: pinned (solution) first, then nested replies
  const topReplies=replies.filter(r=>!r.parent_reply_id)
  const childReplies=replies.filter(r=>!!r.parent_reply_id)

  if(threadLoading) return <div style={{minHeight:'100vh',background:C.bg,padding:'40px 20px'}}><div style={{maxWidth:'860px',margin:'0 auto'}}>{Array.from({length:3}).map((_,i)=><Skeleton key={i}/>)}</div></div>

  if(threadError||!thread) return <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
    <div style={{textAlign:'center',background:C.card,padding:'40px',borderRadius:'16px',border:`1px solid ${C.border}`,boxShadow:'0 4px 20px rgba(0,0,0,0.02)'}}>
      <AlertCircle size={56} color='#EF4444' style={{margin:'0 auto 16px',display:'block'}}/>
      <p style={{color:'#EF4444',fontSize:'1.1rem',fontWeight:600,marginBottom:'20px'}}>{threadError||'Thread tidak ditemukan'}</p>
      <Link href="/forum" style={{color:C.accent,fontSize:'0.9rem',fontWeight:600,textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'6px'}}><ArrowLeft size={16}/>Kembali ke Forum</Link>
    </div>
  </div>

  const catStyle=categoryStyles[thread.category]

  return <div style={{minHeight:'100vh',background:C.bg,fontFamily:'var(--font-inter,Inter,sans-serif)',color:C.textPrimary}}>
    <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}`}</style>

    {/* Toast */}
    {toast&&<div style={{position:'fixed',bottom:'32px',right:'32px',zIndex:9999,background:C.card,border:`1px solid ${C.accentBorder}`,borderRadius:'12px',padding:'16px 24px',color:C.textPrimary,fontSize:'0.95rem',fontWeight:500,boxShadow:'0 10px 40px rgba(0,0,0,0.1)',animation:'toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'}}>{toast}</div>}

    <div style={{maxWidth:'860px',margin:'0 auto',padding:'40px 20px'}}>

      {/* Breadcrumb */}
      <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'24px',flexWrap:'wrap'}}>
        <Link href="/forum" style={{color:C.textMuted,fontSize:'0.85rem',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px',fontWeight:500}}><ArrowLeft size={16}/>Forum</Link>
        <ChevronRight size={14} color={C.textPlaceholder}/>
        <span style={{color:catStyle.color,fontSize:'0.85rem',fontWeight:600}}>{catStyle.label}</span>
        <ChevronRight size={14} color={C.textPlaceholder}/>
        <span style={{color:C.textMuted,fontSize:'0.85rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'250px'}}>{thread.title}</span>
      </div>

      {/* Thread Header Card */}
      <div style={{background:C.card,border:`1px solid ${thread.is_pinned?C.accentBorder:C.border}`,borderRadius:'16px',padding:'32px',marginBottom:'24px',boxShadow:'0 4px 20px rgba(0, 0, 0, 0.02)'}}>
        {thread.is_pinned&&<div style={{height:'3px',background:`linear-gradient(90deg,${C.accent},transparent)`,margin:'-32px -32px 24px'}}/>}

        {/* Status Badges */}
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'16px'}}>
          <span style={{background:catStyle.bg,color:catStyle.color,border:`1px solid ${catStyle.border}`,borderRadius:'9999px',padding:'4px 12px',fontSize:'0.75rem',fontWeight:700}}>{catStyle.label}</span>
          {thread.is_pinned&&<span style={{color:C.accent,fontSize:'0.75rem',display:'flex',alignItems:'center',gap:'4px',fontWeight:600}}><Pin size={14}/>Disematkan</span>}
          {thread.is_locked&&<span style={{color:'#EF4444',fontSize:'0.75rem',display:'flex',alignItems:'center',gap:'4px',fontWeight:600}}><Lock size={14}/>Terkunci</span>}
          {thread.is_resolved&&<span style={{color:C.accent,fontSize:'0.75rem',display:'flex',alignItems:'center',gap:'4px',fontWeight:600}}><CheckCircle size={14}/>Terselesaikan</span>}
        </div>

        <h1 style={{fontSize:'1.75rem',fontWeight:800,margin:'0 0 20px',lineHeight:1.3,color:C.textPrimary,letterSpacing:'-0.02em'}}>{thread.title}</h1>

        {/* Author Info */}
        <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'24px'}}>
          <Avatar initials={thread.author_avatar} role={thread.author_role} size={48}/>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}}>
              <span style={{color:C.textPrimary,fontWeight:700,fontSize:'1rem'}}>{thread.author_name}</span>
              <RoleBadge role={thread.author_role}/>
            </div>
            <span style={{color:C.textPlaceholder,fontSize:'0.85rem'}}>{formatRelativeTime(thread.created_at)} · <span style={{fontWeight:500}}>{thread.view_count}</span> dilihat · <span style={{fontWeight:500}}>{thread.reply_count}</span> balasan</span>
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:'10px',flexWrap:'wrap'}}>
            <button onClick={handleShare} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',borderRadius:'10px',border:`1px solid ${C.border}`,background:C.card,color:C.textSecondary,fontSize:'0.85rem',fontWeight:500,cursor:'pointer',transition:'background 0.2s',boxShadow:'0 1px 2px rgba(0,0,0,0.02)'}} onMouseOver={e=>e.currentTarget.style.background=C.input} onMouseOut={e=>e.currentTarget.style.background=C.card}><Share2 size={16}/>Bagikan</button>
            {isAdmin&&<>
              <button onClick={handleTogglePin} style={{padding:'8px 16px',borderRadius:'10px',border:`1px solid ${C.border}`,background:C.card,color:C.textSecondary,fontSize:'0.85rem',fontWeight:500,cursor:'pointer',transition:'background 0.2s'}} onMouseOver={e=>e.currentTarget.style.background=C.input} onMouseOut={e=>e.currentTarget.style.background=C.card}>{thread.is_pinned?'Lepas Sematan':'Sematkan'}</button>
              <button onClick={handleToggleLock} style={{padding:'8px 16px',borderRadius:'10px',border:`1px solid ${thread.is_locked?'#FECACA':C.border}`,background:thread.is_locked?'#FEF2F2':C.card,color:thread.is_locked?'#EF4444':C.textSecondary,fontSize:'0.85rem',fontWeight:500,cursor:'pointer',transition:'background 0.2s'}}>{thread.is_locked?'Buka Kunci':'Kunci Thread'}</button>
            </>}
          </div>
        </div>

        {/* Body */}
        <div style={{background:C.input,borderRadius:'12px',padding:'24px',marginBottom:'24px',border:`1px solid ${C.border}`}}>
          <p style={{color:C.textSecondary,fontSize:'1rem',lineHeight:1.8,margin:0,whiteSpace:'pre-wrap'}}>{thread.body}</p>
        </div>

        {/* Tags */}
        {thread.tags.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginBottom:'16px'}}>
          {thread.tags.map(t=><span key={t} style={{background:C.card,color:C.textMuted,border:`1px solid ${C.border}`,borderRadius:'9999px',padding:'4px 12px',fontSize:'0.75rem',fontWeight:500}}>#{t}</span>)}
        </div>}

        {/* Related Order */}
        {thread.related_order_id&&<Link href={`/orders/${thread.related_order_id}`} style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 16px',borderRadius:'10px',border:`1px solid #FCD34D`,background:'#FFFBEB',color:'#D97706',fontSize:'0.85rem',textDecoration:'none',fontWeight:600}}>
          📦 Order Terkait: {thread.related_order_id}
        </Link>}
      </div>

      {/* New Replies Banner */}
      {newRepliesCount>0&&<div style={{background:C.accentGlow,border:`1px solid ${C.accentBorder}`,borderRadius:'12px',padding:'12px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
        <span style={{color:C.accent,fontSize:'0.9rem',fontWeight:600}}>Terdapat {newRepliesCount} balasan baru sejak Anda masuk</span>
        <button onClick={clearNewReplies} style={{background:C.card,border:`1px solid ${C.accentBorder}`,borderRadius:'8px',padding:'6px 12px',color:C.accent,cursor:'pointer',fontSize:'0.8rem',fontWeight:700}}>Tutup Info</button>
      </div>}

      {/* Solution Highlight */}
      {solutionReply&&<div style={{background:'rgba(5, 150, 105, 0.05)',border:`1px solid ${C.accentBorder}`,borderRadius:'16px',padding:'20px 24px',marginBottom:'28px',boxShadow:'0 2px 10px rgba(5,150,105,0.05)'}}>
        <p style={{color:C.accent,fontSize:'0.85rem',fontWeight:800,margin:'0 0 12px',display:'flex',alignItems:'center',gap:'8px'}}><CheckCircle size={18}/>SOLUSI TERPILIH DARI {solutionReply.author_name.toUpperCase()}</p>
        <p style={{color:C.textSecondary,fontSize:'0.95rem',margin:0,lineHeight:1.7}}>{solutionReply.body.slice(0,250)}{solutionReply.body.length>250&&'...'}</p>
      </div>}

      {/* Replies Section */}
      <div style={{marginBottom:'16px'}}>
        <h2 style={{color:C.textPrimary,fontSize:'1.1rem',fontWeight:700,margin:'0 0 20px',display:'flex',alignItems:'center',gap:'10px',borderBottom:`1px solid ${C.border}`,paddingBottom:'12px'}}>
          <MessageSquare size={20} color={C.accent}/>{thread.reply_count} Balasan Diskusi
        </h2>

        {repliesLoading?Array.from({length:3}).map((_,i)=><Skeleton key={i}/>):
          topReplies.map(reply=><React.Fragment key={reply.id}>
            <ReplyCard reply={reply} threadAuthorId={thread.author_id} threadId={threadId} isLocked={thread.is_locked} hasSolution={hasSolution} onReply={setReplyingTo} onMarkSolution={handleMarkSolution} onDelete={handleDelete}/>
            {childReplies.filter(c=>c.parent_reply_id===reply.id).map(child=>
              <ReplyCard key={child.id} reply={child} threadAuthorId={thread.author_id} threadId={threadId} isLocked={thread.is_locked} hasSolution={hasSolution} onReply={setReplyingTo} onMarkSolution={handleMarkSolution} onDelete={handleDelete} isNested/>
            )}
          </React.Fragment>)
        }

        {topReplies.length===0&&!repliesLoading&&<div style={{textAlign:'center',padding:'60px 20px',background:C.card,border:`1px solid ${C.border}`,borderRadius:'16px',boxShadow:'0 4px 20px rgba(0,0,0,0.02)'}}>
          <MessageSquare size={48} color={C.border} style={{margin:'0 auto 16px',display:'block'}}/>
          <p style={{color:C.textSecondary,fontSize:'1rem',fontWeight:500,margin:0}}>Belum ada yang membalas. Mulai percakapan sekarang!</p>
        </div>}
      </div>

      {/* Reply Form / Login CTA */}
      {isAuthenticated?
        !thread.is_locked||isAdmin?
          <ReplyForm threadId={threadId} replyingTo={replyingTo} onCancel={()=>setReplyingTo(null)} onSubmit={handleReply}/>:
          <div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:'16px',padding:'24px',textAlign:'center',marginTop:'28px'}}>
            <Lock size={32} color='#EF4444' style={{margin:'0 auto 12px',display:'block'}}/>
            <p style={{color:'#EF4444',fontSize:'0.95rem',fontWeight:600,margin:0}}>Thread diskusi ini telah dikunci. Balasan baru tidak lagi dapat ditambahkan.</p>
          </div>:
        <div style={{background:C.card,border:`1px solid ${C.accentBorder}`,borderRadius:'16px',padding:'32px 20px',textAlign:'center',marginTop:'28px',boxShadow:'0 4px 20px rgba(5, 150, 105, 0.05)'}}>
          <p style={{color:C.textPrimary,margin:'0 0 16px',fontSize:'1.05rem',fontWeight:600}}>Anda harus login untuk membalas diskusi ini</p>
          <Link href="/login" style={{display:'inline-block',padding:'12px 32px',borderRadius:'10px',background:C.accent,color:'#FFFFFF',fontWeight:600,textDecoration:'none',fontSize:'0.95rem',boxShadow:'0 4px 12px rgba(5, 150, 105, 0.2)'}}>Login ke Akun Anda</Link>
        </div>
      }
    </div>
  </div>
}