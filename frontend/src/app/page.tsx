'use client';

import React, { useState } from 'react';

interface Experience { role: string; company: string; duration: string; details: string[]; }
interface Project { name: string; techStack: string; details: string[]; link: string; }
interface Education { degree: string; institution: string; year: string; }
interface Certification { name: string; issuer: string; year: string; }

interface ParsedData {
  name: string; email: string; phone: string; location: string; summary: string;
  skills: string[]; experience: Experience[]; projects: Project[];
  education: Education[]; certifications: Certification[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<ParsedData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('cv', file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        console.error("API URL is not defined. Please set NEXT_PUBLIC_API_URL in your environment variables.");
        alert('Configuration error: The API endpoint is not set.');
        setLoading(false);
        return;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) setProfile(result.data);
      else alert(result.error || 'Pipeline execution failure.');
    } catch (err) {
      console.error(err);
      alert('Network transmission connection fault.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-5 py-10 font-sans">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-2">Advanced CV Parsing Engine</h1>
      </header>

      {/* Upload Zone */}
      <section className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-10 text-center mb-10">
        <form onSubmit={handleUploadSubmit}>
          <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="file-upload-input" />
          <label htmlFor="file-upload-input" className="cursor-pointer inline-block px-6 py-3 bg-slate-900 text-white rounded-md font-semibold mb-4 hover:bg-slate-800 transition-colors">
            {file ? file.name : 'Select Target CV File (PDF)'}
          </label>
          {file && (
            <div>
              <button type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-500 text-white border-none rounded-md cursor-pointer font-semibold disabled:bg-blue-300 disabled:cursor-not-allowed">
                {loading ? 'Analyzing Architecture...' : 'Extract Data Profile'}
              </button>
            </div>
          )}
        </form>
      </section>

      {/* Recreated Application View */}
      {profile && (
        <section className="bg-white border border-slate-200 rounded-2xl p-10 shadow-lg">
          
          {/* Header Area */}
          <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 5px 0', color: '#0f172a' }}>{profile.name}</h2>
            <p style={{ margin: '0 0 15px 0', color: '#64748b', fontSize: '1rem' }}>
              {profile.location && <span>📍 {profile.location} &nbsp;|&nbsp; </span>}
              ✉️ {profile.email || 'N/A'} &nbsp;|&nbsp; 📱 {profile.phone || 'N/A'}
            </p>
            {profile.summary && (
              <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '0.95rem' }}>{profile.summary}</p>
            )}
          </div>

          {/* Skills Area */}
          <div style={{ marginBottom: '35px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Technical Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.skills.map((skill, index) => (
                <span key={index} style={{ background: '#f1f5f9', color: '#334155', padding: '6px 12px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experience Area */}
          <div style={{ marginBottom: '35px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Experience</h3>
            {profile.experience.map((exp, index) => (
              <div key={index} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{exp.role}</h4>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{exp.duration}</span>
                </div>
                <p style={{ margin: '0 0 10px 0', color: '#3b82f6', fontWeight: 600, fontSize: '0.95rem' }}>{exp.company}</p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {exp.details.map((detail, idx) => <li key={idx}>{detail}</li>)}
                </ul>
              </div>
            ))}
          </div>

          {/* Projects Area */}
          <div style={{ marginBottom: '35px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Key Projects</h3>
            {profile.projects.map((proj, index) => (
              <div key={index} style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>{proj.name} {proj.link && <span style={{fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', marginLeft: '10px'}}>Link</span>}</h4>
                {proj.techStack && <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#64748b' }}><strong>Stack:</strong> {proj.techStack}</p>}
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {proj.details.map((detail, idx) => <li key={idx}>{detail}</li>)}
                </ul>
              </div>
            ))}
          </div>

          {/* Dual Column: Education & Certifications */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Education</h3>
              {profile.education.map((edu, index) => (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{edu.degree}</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{edu.institution} &bull; {edu.year}</p>
                </div>
              ))}
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Licenses & Certs</h3>
              {profile.certifications.map((cert, index) => (
                <div key={index} style={{ marginBottom: '10px' }}>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{cert.name}</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>{cert.issuer} ({cert.year})</p>
                </div>
              ))}
            </div>
          </div>

        </section>
      )}
    </main>
  );
}