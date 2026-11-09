// Script para corrigir encoding das categorias no IndexedDB
import { db } from '../db/database';

export async function fixDebtCategories() {
  try {
    console.log('[FixCategories] Iniciando correção...');
    
    // Obter todas as categorias
    const categories = await db.debtCategories.toArray();
    
    // Mapa de correção
    const corrections = {
      'Cart\u00e3o': 'Cartão',
      'CartÃ£o': 'Cartão',
      'Essencial': 'Essencial',
      'Lazer': 'Lazer',
      'Outros': 'Outros'
    };
    
    // Atualizar cada categoria com nome correto
    for (const cat of categories) {
      const correctName = corrections[cat.name] || cat.name;
      
      if (correctName !== cat.name) {
        console.log(`[FixCategories] Corrigindo: "${cat.name}" → "${correctName}"`);
        await db.debtCategories.update(cat.id, { 
          name: correctName,
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    console.log('[FixCategories] Correção concluída!');
    return { success: true, updated: categories.length };
  } catch (err) {
    console.error('[FixCategories] Erro:', err);
    return { success: false, error: err.message };
  }
}

// Também corrigir categorias de transações se necessário
export async function fixTransactionCategories() {
  try {
    const categories = await db.transactionCategories.toArray();
    
    const corrections = {
      'Salário': 'Salário',
      'Salario': 'Salário',
      'Comiss\u00e3o': 'Comissão',
      'ComissÃ£o': 'Comissão',
      'Educa\u00e7\u00e3o': 'Educação',
      'EducaÃ§Ã£o': 'Educação',
      'Sa\u00fade': 'Saúde',
      'SaÃºde': 'Saúde',
      'Habita\u00e7\u00e3o': 'Habitação',
      'HabitaÃ§Ã£o': 'Habitação',
      'Cart\u00e3o': 'Cartão',
      'CartÃ£o': 'Cartão',
    };
    
    for (const cat of categories) {
      const correctName = corrections[cat.name] || cat.name;
      
      if (correctName !== cat.name) {
        console.log(`[FixCategories] Corrigindo transação: "${cat.name}" → "${correctName}"`);
        await db.transactionCategories.update(cat.id, { 
          name: correctName,
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return { success: true };
  } catch (err) {
    console.error('[FixCategories] Erro em transações:', err);
    return { success: false, error: err.message };
  }
}
