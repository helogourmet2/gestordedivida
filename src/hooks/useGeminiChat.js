import { useState, useRef, useCallback } from 'react';
import { geminiModel, buildSystemPrompt } from '../lib/gemini';
import { db } from '../db/database';

export function useGeminiChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Olá! Sou seu assistente financeiro. Posso analisar suas dívidas, receitas e despesas e te ajudar a tomar decisões. O que você quer saber?',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const initChat = useCallback(async () => {
    // Busca dados reais do IndexedDB
    const [debts, transactions, categories] = await Promise.all([
      db.debts.toArray(),
      db.transactions.toArray(),
      db.transactionCategories.toArray(),
    ]);

    const systemPrompt = buildSystemPrompt({
      debts,
      transactions,
      categories,
      now: new Date(),
    });

    // Inicia sessão de chat com contexto financeiro
    chatRef.current = geminiModel.startChat({
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
      history: [],
    });
  }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;

    // Adiciona mensagem do usuário
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      // Inicializa chat na primeira mensagem
      if (!chatRef.current) {
        await initChat();
      }

      const result = await chatRef.current.sendMessage(text);
      const response = result.response.text();

      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (err) {
      console.error('[Gemini] Erro completo:', err);
      console.error('[Gemini] Mensagem:', err.message);
      console.error('[Gemini] Stack:', err.stack);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Erro: ${err.message || String(err)}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, initChat]);

  const resetChat = useCallback(() => {
    chatRef.current = null;
    setMessages([
      {
        role: 'assistant',
        text: 'Conversa reiniciada. Como posso te ajudar?',
      },
    ]);
  }, []);

  return { messages, loading, sendMessage, resetChat };
}
