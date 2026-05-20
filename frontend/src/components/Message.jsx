/**
 * components/Message.jsx
 * Burbuja de mensaje individual con soporte para markdown básico.
 */

import { useEffect, useRef } from "react";

// Renderizador de markdown básico (sin dependencias externas)
function parseMarkdown(text) {
  if (!text) return "";

  return text
    // Encabezados
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Negritas y cursivas
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Líneas horizontales
    .replace(/^---$/gm, "<hr>")
    // Listas con viñeta
    .replace(/^[•\-\*] (.+)$/gm, "<li>$1</li>")
    // Código inline
    .replace(/`(.+?)`/g, "<code>$1</code>")
    // Saltos de línea
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    // Wrap párrafos
    .replace(/(.*?)(<h[123]>|<hr>|<li>|<\/p><p>|$)/gs, (match, text, tag) => {
      const trimmed = text.trim();
      return trimmed && !trimmed.startsWith("<") ? `<p>${trimmed}</p>${tag}` : `${trimmed}${tag}`;
    });
}

function formatTime(date) {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Message({ message }) {
  const { role, content, timestamp } = message;
  const isUser = role === "user";

  return (
    <div className={`message-wrapper ${isUser ? "user" : "bot"}`}>
      <div className={`msg-avatar ${isUser ? "user-avatar" : "bot-avatar"}`}>
        {isUser ? "👤" : "🏥"}
      </div>

      <div>
        <div className="msg-bubble">
          {isUser ? (
            <span>{content}</span>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
            />
          )}
        </div>
        <span className="msg-timestamp">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}
