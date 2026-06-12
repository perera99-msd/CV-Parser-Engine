function parseRawText(text) {
  // 1. CLEANING PHASE: Remove PDF artifacts and formatting emojis
  let cleanText = text.replace(/---\s*PAGE\s*\d+\s*---/gi, '');
  cleanText = cleanText.replace(/\[Image \d+\]/gi, ''); // Remove image artifacts
  cleanText = cleanText.replace(/[📍✉️📱]/g, ''); // Strip emojis
  const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const profile = {
    name: 'Unknown Applicant', email: '', phone: '', location: '', summary: '',
    skills: [], experience: [], projects: [], education: [], certifications: [], rawText: text
  };

  // 2. METADATA PHASE: Extract core contact info
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /\+?\d{1,4}?[\s-]?\(?\d{1,3}?\)?[\s-]?\d{3,4}[\s-]?\d{4,}/;

  if (lines.length > 0) profile.name = lines[0];

  for (let i = 0; i < Math.min(15, lines.length); i++) {
    if (!profile.email && emailRegex.test(lines[i])) profile.email = lines[i].match(emailRegex)[0];
    if (!profile.phone && phoneRegex.test(lines[i])) profile.phone = lines[i].match(phoneRegex)[0];
    
    // Extract Location (Look for city/country markers on the first few lines)
    if (!profile.location && /(Sri Lanka|Colombo|Remote|City|Province|,)/i.test(lines[i]) && !lines[i].includes('@') && lines[i].length < 40 && i > 0) {
      profile.location = lines[i].split('|')[0].trim(); 
    }
  }

  // 3. SORTING PHASE: Bucket lines into appropriate sections
  const sections = { summary: [], skills: [], experience: [], projects: [], education: [], certifications: [] };
  let currentSection = 'summary';

  // Expanded Lexicon
  const sectionKeywords = {
    summary: ['professional summary', 'profile', 'overview'],
    skills: ['technical skills', 'skills', 'core competencies'],
    projects: ['project experience', 'key projects', 'projects', 'personal projects'],
    experience: ['work experience', 'experience', 'employment', 'work history', 'professional history'],
    education: ['education', 'academic background'],
    certifications: ['licenses & certifications', 'licenses & certs', 'certifications', 'licenses', 'additional strengths'],
    references: ['references'] // Catch reference section so it doesn't bleed into education
  };

  for (let line of lines) {
    const lowerLine = line.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    let foundNewSection = null;

    for (const [key, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(kw => lowerLine.startsWith(kw) && line.length < 50)) {
        foundNewSection = key;
        break;
      }
    }

    if (foundNewSection) {
      if (foundNewSection === 'references') {
        currentSection = 'references'; // Ignore references entirely
      } else {
        currentSection = foundNewSection;
      }
    } else if (currentSection !== 'references') {
      // Ignore contact info leaking into the summary block
      if (currentSection === 'summary' && (line.includes(profile.email) || phoneRegex.test(line) || line.includes(profile.name))) continue;
      sections[currentSection].push(line);
    }
  }

  // 4. ASSEMBLY PHASE: State Machines for each specific bucket

  // --- Process Summary ---
  profile.summary = sections.summary.filter(line => line.length > 20).join(' ').replace(/\|\s*/g, '').trim();

  // --- Process Skills ---
  profile.skills = sections.skills
    .flatMap(line => line.replace(/^[a-zA-Z\s&]+:\s/, '').split(/[,|•●]/))
    .map(s => s.trim())
    .filter(s => s.length > 1 && s.length < 40);

  // --- Process Projects (Strict Metadata Only) ---
  let projBlock = null;
  for (let i = 0; i < sections.projects.length; i++) {
    let line = sections.projects[i];
    const isStack = /^(Tech )?Stack:|Technologies:/i.test(line); 
    const isLink = /https?:\/\//i.test(line) || /github\.com/i.test(line) || /vercel\.app/i.test(line);

    if (!isStack && !isLink && line.length < 80 && !line.startsWith('•') && !line.startsWith('●') && !line.startsWith('-') && !line.endsWith('.')) {
      if (!projBlock || projBlock.techStack || projBlock.link) {
        if (projBlock) profile.projects.push(projBlock);
        projBlock = { 
          name: line.replace(/Link|GitHub|Live Site/ig, '').replace(/[-|]/g, '').trim(), 
          techStack: '', link: '', details: [] 
        };
      } else {
        projBlock.name += " " + line.trim();
      }
    } else if (isStack && projBlock) {
      projBlock.techStack = line.replace(/^(Tech )?Stack:\s*|Technologies:\s*/i, '').trim();
    } else if (isLink && projBlock) {
      projBlock.link = line;
    }
  }
  if (projBlock) profile.projects.push(projBlock);

  // --- Process Experience (Strict Metadata Only) ---
  let expBlock = null;
  for (let i = 0; i < sections.experience.length; i++) {
    let line = sections.experience[i];
    
    const isDate = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|20\d{2})\s*(?:-|–|to)\s*(?:Present|20\d{2})/i.test(line);
    const isLocation = /(Remote|Hybrid|On-site)/i.test(line) && line.length < 20;
    const isBullet = line.startsWith('•') || line.startsWith('●') || line.startsWith('-');
    
    // Treat as title/company only if it's short and not a date/location/bullet/description
    if (!isBullet && !isDate && !isLocation && line.length < 60 && !line.includes(':') && !line.endsWith('.')) {
      if (!expBlock || expBlock.duration) {
        if (expBlock) profile.experience.push(expBlock);
        expBlock = { role: line, company: '', duration: '', details: [] };
      } else if (!expBlock.company) {
        expBlock.company = line;
      }
    } else if (isLocation || isDate) {
      if (expBlock) expBlock.duration = expBlock.duration ? expBlock.duration + ' | ' + line : line;
    }
  }
  if (expBlock) profile.experience.push(expBlock);

  // --- Process Education (Strict Metadata Only) ---
  let eduBlock = null;
  for (let i = 0; i < sections.education.length; i++) {
    let line = sections.education[i];
    
    // Ignore description lines or very long lines
    if (line.toLowerCase().startsWith('core modules') || line.length > 80) continue;

    const isDegree = /\b(BSc|B\.Sc|BA|B\.A|Master|Diploma|Certificate|G\.C\.E|Level|Degree)\b/i.test(line);

    if (isDegree || line.includes('|')) {
      if (eduBlock) profile.education.push(eduBlock);
      eduBlock = { degree: '', institution: '', year: '' };
      
      if (line.includes('|')) {
        let parts = line.split('|').map(p => p.trim());
        eduBlock.degree = parts[0];
        eduBlock.institution = parts[1] || '';
      } else {
        eduBlock.degree = line.trim();
      }
    } else if (eduBlock) {
      const yearMatch = line.match(/(19|20)\d{2}/);
      if (yearMatch && !eduBlock.year) eduBlock.year = yearMatch[0];
      
      if (!line.startsWith('●') && !line.startsWith('•')) {
        let instName = line.replace(/(19|20)\d{2}/, '').replace(/[•●]|Anticipated|Oct|Present|–|-/gi, '').trim();
        if (instName.endsWith(',')) instName = instName.slice(0, -1);
        
        if (instName.length > 0 && !yearMatch && !eduBlock.institution) {
          eduBlock.institution = instName;
        }
      }
    }
  }
  if (eduBlock) profile.education.push(eduBlock);

  // --- Process Certifications ---
  for (let i = 0; i < sections.certifications.length; i++) {
    let line = sections.certifications[i];
    if (line.includes('|')) {
       let parts = line.split('|').map(p => p.trim());
       let issuer = parts[1] || 'N/A';
       let year = parts[2] || 'N/A';
       
       let yearMatch = issuer.match(/(19|20)\d{2}/);
       if (yearMatch && year === 'N/A') {
         year = yearMatch[0];
         issuer = issuer.replace(/\(?(19|20)\d{2}[^)]*\)?/g, '').trim();
       }
       
       profile.certifications.push({ name: parts[0], issuer: issuer, year: year });
    } else if (line.startsWith('•') || line.startsWith('●')) {
       let certName = line.replace(/^[•●]\s*/, '').trim();
       // Ignore empty bullets or standalone years
       if (certName.length > 5 && !/^(19|20)\d{2}$/.test(certName)) {
         profile.certifications.push({ name: certName, issuer: 'N/A', year: 'N/A' });
       }
    }
  }

  return profile;
}

module.exports = { parseRawText };