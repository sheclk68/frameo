"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { createClient } from "@/lib/supabase-client";
import { Poll, PollVote } from "@/lib/types";

const icons = {
  back: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  ),
  vote: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  ),
  add: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  ),
  chart: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
    </svg>
  ),
};

export default function PollsPage() {
  const [user, setUser] = useState<{ fid?: number; username?: string }>({});
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votes, setVotes] = useState<{ [pollId: number]: number }>({});
  const [voteCounts, setVoteCounts] = useState<{ [pollId: number]: number }>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [optionsInput, setOptionsInput] = useState("");
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [message, setMessage] = useState("");
  const [votingPoll, setVotingPoll] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const ctx = await sdk.context;
        setUser(ctx?.user || {});
        sdk.actions.ready();
        loadPolls();
        if (ctx?.user?.fid) loadUserVotes(ctx.user.fid);
      } catch (e) {
        console.log("Outside Farcaster");
      }
      setIsSDKReady(true);
    };
    init();
  }, []);

  const loadPolls = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("polls")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        setPolls(data.map(p => ({ ...p, options: p.options as unknown as string[] })));
        loadVoteCounts();
      }
    } catch (e) {
      console.log("No polls");
    }
  };

  const loadUserVotes = async (fid: number) => {
    try {
      const supabase = createClient();
      const { data } = await supabase.from("poll_votes").select("*").eq("fid", fid);
      if (data) {
        const voteMap: { [pollId: number]: number } = {};
        data.forEach((v: PollVote) => { voteMap[v.poll_id] = v.option_index; });
        setVotes(voteMap);
      }
    } catch (e) {
      console.log("No votes");
    }
  };

  const loadVoteCounts = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("poll_votes")
        .select("poll_id");
      if (data) {
        const counts: { [pollId: number]: number } = {};
        data.forEach((v: { poll_id: number }) => {
          counts[v.poll_id] = (counts[v.poll_id] || 0) + 1;
        });
        setVoteCounts(counts);
      }
    } catch (e) {
      console.log("No vote counts");
    }
  };

  const castVote = async (pollId: number, optionIndex: number) => {
    if (!user.fid) {
      setMessage("Please sign in with Farcaster first");
      return;
    }
    if (votes[pollId] !== undefined) {
      setMessage("You already voted on this poll");
      return;
    }
    setVotingPoll(pollId);
    try {
      const supabase = createClient();
      await supabase.from("poll_votes").insert({
        poll_id: pollId,
        fid: user.fid,
        option_index: optionIndex,
      });
      setVotes(prev => ({ ...prev, [pollId]: optionIndex }));
      setVoteCounts(prev => ({ ...prev, [pollId]: (prev[pollId] || 0) + 1 }));
      setMessage("Vote cast successfully ✅");
    } catch (e) {
      setMessage("Vote failed");
    }
    setVotingPoll(null);
  };

  const createPoll = async () => {
    if (!newTitle.trim() || !optionsInput.trim()) {
      setMessage("Title and options required");
      return;
    }
    const options = optionsInput.split(",").map(s => s.trim()).filter(Boolean);
    if (options.length < 2) {
      setMessage("Need at least 2 options");
      return;
    }
    try {
      const supabase = createClient();
      await supabase.from("polls").insert({
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        creator_fid: user.fid || 0,
        options: options,
        is_active: true,
      });
      setNewTitle("");
      setNewDesc("");
      setOptionsInput("");
      setShowCreate(false);
      setMessage("Poll created! ✅");
      loadPolls();
    } catch (e) {
      setMessage("Failed to create poll");
    }
  };

  const getTotalVotes = (poll: Poll) => {
    return voteCounts[poll.id] || 0;
  };

  if (!isSDKReady) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-fc-gradient p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full shimmer" />
          <div className="w-40 h-4 rounded shimmer" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-fc-gradient">
      <header className="pt-12 pb-4 px-6 fade-in">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => window.location.href = "/"} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            {icons.back}
          </button>
          <h1 className="text-lg font-bold text-white">Polls</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="ml-auto flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
          >
            {icons.add}
            Create
          </button>
        </div>
      </header>

      {/* Create Poll Form */}
      {showCreate && (
        <section className="px-6 mb-4 slide-up">
          <div className="max-w-md mx-auto glass-card p-4 glow-purple">
            <h3 className="text-sm font-bold text-white mb-3">Create a Poll</h3>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Poll title"
              className="input-glass mb-2"
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="input-glass mb-2"
            />
            <input
              value={optionsInput}
              onChange={(e) => setOptionsInput(e.target.value)}
              placeholder="Options: Option A, Option B, Option C"
              className="input-glass mb-2"
            />
            <p className="text-[10px] text-gray-500 mb-3">Separate options with commas</p>
            <button onClick={createPoll} className="btn-primary w-full text-sm">
              Create Poll
            </button>
          </div>
        </section>
      )}

      {/* Polls List */}
      <section className="px-6 flex-1 fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="max-w-md mx-auto space-y-3">
          {polls.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <div className="text-3xl mb-3">{icons.vote}</div>
              <p className="text-sm text-gray-400">No polls yet</p>
              <p className="text-xs text-gray-600 mt-1">Create the first one!</p>
            </div>
          ) : (
            polls.map((poll) => {
              const userVote = votes[poll.id];
              return (
                <div key={poll.id} className="glass-card p-4 hover-scale">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white">{poll.title}</h3>
                      {poll.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{poll.description}</p>
                      )}
                    </div>
                    <span className="badge badge-green ml-2">Active</span>
                  </div>

                  {/* Options */}
                  <div className="space-y-1.5 mt-3">
                    {poll.options.map((opt, idx) => {
                      const isSelected = userVote === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => castVote(poll.id, idx)}
                          disabled={userVote !== undefined}
                          className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-left text-sm transition-all cursor-pointer ${
                            isSelected
                              ? "bg-purple-600/20 border border-purple-500/30 text-purple-300"
                              : "bg-white/5 border border-white/5 text-gray-300 hover:border-purple-500/20"
                          } ${userVote !== undefined ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-[9px]">
                              ✓
                            </span>
                          )}
                          {!isSelected && (
                            <div className="w-4 h-4 rounded-full border border-gray-600" />
                          )}
                          <span className="flex-1">{opt}</span>
                          {isSelected && (
                            <span className="text-[10px] text-purple-400">Your vote</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800">
                    <span className="text-[10px] text-gray-600">
                      {new Date(poll.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-500">
                        {getTotalVotes(poll)} vote{getTotalVotes(poll) !== 1 ? "s" : ""}
                      </span>
                      {userVote !== undefined && (
                        <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                          {icons.vote} Voted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {message && <div className="toast" onClick={() => setMessage("")}>{message}</div>}

      <footer className="px-6 py-6 fade-in">
        <div className="max-w-md mx-auto text-center">
          <p className="text-[10px] text-gray-600">Vote on polls · Powered by FrameOS</p>
        </div>
      </footer>
    </main>
  );
}
