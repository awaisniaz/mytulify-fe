"use client";

import * as React from "react";
import { Button, Input, Select, Textarea } from "@/components/ui/primitives";
import { Field, Notice } from "@/components/tools/shared";

type CategoryOption = { slug: string; name: string };

export function RequestToolForm({ categories }: { categories: CategoryOption[] }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState(categories[0]?.slug ?? "");
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !description.trim()) {
      setError("Please enter a tool name and description.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/request-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: name.trim(),
          description: description.trim(),
          category: category || null,
          email: email.trim() || null,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not submit. Please try again.");
        return;
      }
      setDone(true);
      setName("");
      setDescription("");
      setEmail("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <Notice tone="success">
        Thanks! We&apos;ll consider this for a future update.
        {email ? " If we ship it, we may email you at the address you provided." : ""}
        {" "}
        <button
          type="button"
          className="font-semibold underline"
          onClick={() => setDone(false)}
        >
          Submit another idea
        </button>
      </Notice>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Tool name / idea" hint="Required">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Invoice PDF merger"
          required
          maxLength={120}
        />
      </Field>
      <Field label="What should it do?" hint="Required — a few sentences is enough">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="font-sans text-sm"
          placeholder="Describe the problem it solves and any must-have options…"
          required
          maxLength={2000}
        />
      </Field>
      <Field label="Category">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
          <option value="other">Other / not sure</option>
        </Select>
      </Field>
      <Field label="Email (optional)" hint="So we can tell you if we build it">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          maxLength={200}
        />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Sending…" : "Submit request"}
      </Button>
    </form>
  );
}
