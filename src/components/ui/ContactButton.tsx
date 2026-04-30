"use client";

import { useState, useRef, useEffect } from "react";

type TeamMember = {
  name: string;
  github: string;
  linkedin: string;
  email: string;
};

export function ContactButton({ team }: { team: TeamMember[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-4 py-1.5 border border-gray-700 text-xs font-bold uppercase tracking-widest text-gray-400 hover:border-amber-500 hover:text-amber-400 transition-colors"
      >
        Contact Us
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 rounded-lg border border-gray-700 bg-gray-900 shadow-2xl z-50 overflow-hidden">
          {team.map((member, i) => (
            <div key={member.name} className={`px-4 py-4 ${i < team.length - 1 ? "border-b border-gray-800" : ""}`}>
              <p className="text-xs font-black uppercase tracking-widest text-white mb-3">{member.name}</p>
              <div className="flex flex-col gap-2">
                <a
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-xs text-gray-400 hover:text-white transition-colors group"
                >
                  <svg className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.026 2.747-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.338 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z" />
                  </svg>
                  <span className="truncate">{member.github.replace("https://github.com/", "github.com/")}</span>
                </a>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-xs text-gray-400 hover:text-white transition-colors group"
                >
                  <svg className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-11 6H6v10h2V9zm-1-3a1 1 0 110 2 1 1 0 010-2zm4 3h-2v10h2v-5c0-1.4.8-2 1.7-2 .8 0 1.3.5 1.3 2v5h2v-5.5c0-2.1-1.2-3.5-3-3.5-.9 0-1.6.4-2 1V9z" />
                  </svg>
                  <span className="truncate">LinkedIn</span>
                </a>
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-2.5 text-xs text-gray-400 hover:text-white transition-colors group"
                >
                  <svg className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">{member.email}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
