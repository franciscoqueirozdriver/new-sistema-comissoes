import { useState, useEffect } from 'react';

interface Feriado {
    date: string;
    name: string;
    type: string;
}

export function calcularDias(ano: number, mes: number, feriados: string[] = []) {
  const feriadosSet = new Set(feriados);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  let uteisSemSabado = 0;
  let uteisComSabado = 0;
  let descanso = 0;
  for (let d = 1; d <= diasNoMes; d++) {
    const data = new Date(ano, mes - 1, d);
    const day = data.getDay();
    const dateStr = data.toISOString().split('T')[0];
    const isFeriado = feriadosSet.has(dateStr);
    if (day === 0 || isFeriado) {
      descanso += 1;
      continue;
    }
    if (day === 6) {
      uteisComSabado += 1;
    } else {
      uteisSemSabado += 1;
      uteisComSabado += 1;
    }
  }
  return { diasSemSabado: uteisSemSabado, diasComSabado: uteisComSabado, diasDescanso: descanso };
}

export default function useDiasUteis(mesAno: string, considerarFeriados: boolean, uf: string, municipio: string) {
  const [dados, setDados] = useState({ diasSemSabado: 0, diasComSabado: 0, diasDescanso: 0 });

  useEffect(() => {
    let isMounted = true;
    async function calcular() {
      const [ano, mes] = mesAno.split('-').map(Number);
      let feriados: string[] = [];
      if (considerarFeriados && uf && municipio) {
        try {
          // Note: This API seems to require a token. For the standalone app, this might need to be mocked or replaced.
          // For now, we'll keep the fetch but be aware it might fail without proper authentication.
          const resp = await fetch(`https://api.calendario.com.br/?json=true&ano=${ano}&estado=${uf}&cidade=${municipio}&token=SEU_TOKEN_AQUI`);
          if (resp.ok) {
            const json: Feriado[] = await resp.json();
            feriados = (json || []).map(f => f.date);
          }
        } catch (_) { /* ignore */ }
      }
      const result = calcularDias(ano, mes, feriados);
      if (isMounted) setDados(result);
    }
    if (mesAno) {
        calcular();
    }
    return () => { isMounted = false; };
  }, [mesAno, considerarFeriados, uf, municipio]);

  return dados;
}
