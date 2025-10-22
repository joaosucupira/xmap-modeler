from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, and_
from typing import Optional, List, Dict, Any
import re
import json

# Importa a função para obter a sessão do banco e todos os modelos de dados
from .database import get_db, Usuario, Processo, Metadados, Area, Documento, Item

router = APIRouter(
    prefix="/banco",
    tags=["Busca Geral no Banco de Dados"]
)

# Função auxiliar para formatar metadados
def formatar_metadado(m, db_session=None):
    """Função para formatar resultado de metadado"""
    # Busca processo relacionado usando id_processo
    processo_relacionado = None
    if db_session and hasattr(m, 'id_processo') and getattr(m, 'id_processo', None):
        try:
            processo = db_session.query(Processo).filter(Processo.id == m.id_processo).first()
            processo_relacionado = processo.titulo if processo else f"Processo #{m.id_processo}"
        except Exception as e:
            print(f"Erro ao buscar processo relacionado: {e}")
    
    # Tratamento seguro para LGPD
    lgpd_value = getattr(m, 'lgpd', 'N/A')
    
    return {
        "id": m.id,
        "titulo": m.nome,
        "subtitulo": f"LGPD: {lgpd_value}" + (f" • {processo_relacionado}" if processo_relacionado else ""),
        "categoria": "Metadado",
        "tags": ["metadado", "dados", str(lgpd_value).lower(), "lgpd"],
        "data_modificacao": getattr(m, 'updated_at', None),
        "relevancia": 1.0,
        "dados_extras": {
            "lgpd": lgpd_value,
            "dados": getattr(m, 'dados', []),
            "processo_relacionado": processo_relacionado,
            "id_processo": getattr(m, 'id_processo', None),
            "id_atividade": getattr(m, 'id_atividade', None)
        }
    }

# Mapeamento melhorado com mais detalhes para busca
MAPEAMENTO_BUSCA = {
    "usuarios": {
        "modelo": Usuario,
        "colunas": [Usuario.nome, Usuario.email],
        "colunas_secundarias": [],
        "resultado": lambda u: {
            "id": u.id,
            "titulo": u.nome,
            "subtitulo": u.email,
            "categoria": "Usuário",
            "tags": ["usuario", "pessoa"],
            "data_modificacao": getattr(u, 'updated_at', None),
            "relevancia": 1.0
        }
    },
    "processos": {
        "modelo": Processo,
        "colunas": [Processo.titulo],
        "colunas_secundarias": [],
        "resultado": lambda p: {
            "id": p.id,
            "titulo": p.titulo,
            "subtitulo": f"Processo #{p.id}",
            "categoria": "Processo",
            "tags": ["processo", "workflow", "bpmn"],
            "data_modificacao": getattr(p, 'data_publicacao', getattr(p, 'updated_at', None)),
            "relevancia": 1.0,
            "dados_extras": {
                "tipo": "processo",
                "status": getattr(p, 'status', 'ativo')
            }
        }
    },
    "metadados": {
        "modelo": Metadados,
        "colunas": [Metadados.nome],
        "colunas_secundarias": [Metadados.lgpd],
        "resultado": formatar_metadado
    },
    "areas": {
        "modelo": Area,
        "colunas": [Area.nome_area, Area.sigla],
        "colunas_secundarias": [],
        "resultado": lambda a: {
            "id": a.id,
            "titulo": getattr(a, 'nome_area', 'Área sem nome'),
            "subtitulo": f"Sigla: {getattr(a, 'sigla', 'N/A')}",
            "categoria": "Área",
            "tags": ["area", "departamento", str(getattr(a, 'sigla', '')).lower()],
            "data_modificacao": getattr(a, 'updated_at', None),
            "relevancia": 1.0
        }
    },
    "documentos": {
        "modelo": Documento,
        "colunas": [Documento.nome_documento],
        "colunas_secundarias": [],
        "resultado": lambda d: {
            "id": d.id,
            "titulo": getattr(d, 'nome_documento', 'Documento sem nome'),
            "subtitulo": "Documento",
            "categoria": "Documento",
            "tags": ["documento", "arquivo"],
            "data_modificacao": getattr(d, 'updated_at', None),
            "relevancia": 1.0
        }
    },
    "items": {
        "modelo": Item,
        "colunas": [Item.nome_item],
        "colunas_secundarias": [],
        "resultado": lambda i: {
            "id": i.id,
            "titulo": getattr(i, 'nome_item', 'Item sem nome'),
            "subtitulo": "Item",
            "categoria": "Item",
            "tags": ["item", "elemento"],
            "data_modificacao": getattr(i, 'updated_at', None),
            "relevancia": 1.0
        }
    }
}

def calcular_relevancia(item, termo_busca: str, coluna_encontrada: str) -> float:
    """Calcula a relevância do resultado baseado em vários fatores"""
    relevancia = 1.0
    
    # Bonus por correspondência exata
    if termo_busca.lower() in getattr(item, coluna_encontrada, "").lower():
        if termo_busca.lower() == getattr(item, coluna_encontrada, "").lower():
            relevancia += 2.0  # Correspondência exata
        elif getattr(item, coluna_encontrada, "").lower().startswith(termo_busca.lower()):
            relevancia += 1.0  # Começa com o termo
        else:
            relevancia += 0.5  # Contém o termo
    
    # Bonus por coluna principal vs secundária
    config = next((c for c in MAPEAMENTO_BUSCA.values() if c["modelo"] == type(item)), None)
    if config:
        coluna_obj = getattr(type(item), coluna_encontrada, None)
        if coluna_obj in config["colunas"]:
            relevancia += 0.5  # Coluna principal
    
    return relevancia

# Endpoint de teste simples
@router.get("/teste-metadados/", summary="Teste de metadados")
async def teste_metadados(db: Session = Depends(get_db)):
    """Endpoint simples para testar a busca de metadados"""
    try:
        # Busca todos os metadados
        metadados = db.query(Metadados).limit(5).all()
        
        result = []
        for m in metadados:
            result.append({
                "id": m.id,
                "nome": m.nome,
                "lgpd": getattr(m, 'lgpd', 'N/A'),
                "dados": getattr(m, 'dados', 'N/A'),
                "id_processo": getattr(m, 'id_processo', None),
                "id_atividade": getattr(m, 'id_atividade', None)
            })
        
        return {
            "total": len(result),
            "metadados": result,
            "campos_disponiveis": [attr for attr in dir(Metadados) if not attr.startswith('_')]
        }
    except Exception as e:
        return {"erro": str(e), "tipo": type(e).__name__}

@router.get("/busca-por-metadados/", summary="Busca processos por dados dos metadados")
async def busca_processos_por_metadados(
    q: str = Query(..., min_length=2, description="Termo para buscar nos dados dos metadados"),
    limite: int = Query(20, ge=1, le=50, description="Número máximo de resultados"),
    db: Session = Depends(get_db)
):
    """
    Busca processos que contêm metadados com dados específicos.
    Exemplo: buscar por 'cpf' retorna todos os processos que têm metadados
    contendo dados relacionados a 'cpf'.
    """
    
    termos = [t.strip() for t in re.split(r'\s+', q.strip()) if len(t.strip()) >= 2]
    if not termos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Termo de busca deve ter pelo menos 2 caracteres válidos."
        )
    
    try:
        # Busca metadados que contêm os termos
        metadados_encontrados = []
        
        # Busca em nome do metadado
        for termo in termos:
            metadados_nome = db.query(Metadados).filter(
                Metadados.nome.ilike(f"%{termo}%")
            ).all()
            metadados_encontrados.extend(metadados_nome)
        
        # Busca no campo LGPD
        for termo in termos:
            metadados_lgpd = db.query(Metadados).filter(
                Metadados.lgpd.ilike(f"%{termo}%")
            ).all()
            metadados_encontrados.extend(metadados_lgpd)
        
        # Busca no array de dados
        if hasattr(Metadados, 'dados'):
            for termo in termos:
                try:
                    # Para PostgreSQL com array ou JSON
                    metadados_dados = db.query(Metadados).filter(
                        func.cast(Metadados.dados, db.Text).ilike(f"%{termo}%")
                    ).all()
                    metadados_encontrados.extend(metadados_dados)
                except Exception as e:
                    # Fallback: busca convertendo para string
                    print(f"Erro na busca em dados (usando fallback): {e}")
                    try:
                        # Tenta busca mais simples
                        todos_metadados = db.query(Metadados).all()
                        for m in todos_metadados:
                            if hasattr(m, 'dados') and m.dados:
                                dados_str = str(m.dados).lower()
                                if termo.lower() in dados_str:
                                    metadados_encontrados.append(m)
                    except Exception as e2:
                        print(f"Erro no fallback também: {e2}")
                        pass
        
        # Remove duplicatas
        metadados_unicos = {}
        for m in metadados_encontrados:
            metadados_unicos[m.id] = m
        
        # Para cada metadado encontrado, busca os processos relacionados
        processos_encontrados = {}
        
        for metadado in metadados_unicos.values():
            processo_relacionado = None
            
            # Usa id_processo para encontrar o processo
            if hasattr(metadado, 'id_processo') and metadado.id_processo:
                processo = db.query(Processo).filter(Processo.id == metadado.id_processo).first()
                if processo:
                    processo_relacionado = processo
            
            # Se não achou por id_processo, busca por referência no título
            if not processo_relacionado:
                processos_com_metadado = db.query(Processo).filter(
                    Processo.titulo.ilike(f"%{metadado.nome}%")
                ).all()
                
                if processos_com_metadado:
                    processo_relacionado = processos_com_metadado[0]
            
            if processo_relacionado and processo_relacionado.id not in processos_encontrados:
                # Calcula relevância
                relevancia = 1.0
                metadados_correspondentes = []
                
                # Verifica correspondência no nome do metadado
                for termo in termos:
                    if termo.lower() in metadado.nome.lower():
                        relevancia += 1.0
                        metadados_correspondentes.append(f"nome: {metadado.nome}")
                    
                    # Verifica no LGPD
                    if hasattr(metadado, 'lgpd') and termo.lower() in metadado.lgpd.lower():
                        relevancia += 0.5
                        metadados_correspondentes.append(f"lgpd: {metadado.lgpd}")
                    
                    # Verifica no array de dados
                    if hasattr(metadado, 'dados') and metadado.dados:
                        dados_str = ""
                        try:
                            if isinstance(metadado.dados, list):
                                dados_str = " ".join(str(d) for d in metadado.dados)
                            else:
                                dados_str = str(metadado.dados)
                        except:
                            dados_str = str(metadado.dados)
                        
                        if termo.lower() in dados_str.lower():
                            relevancia += 1.5  # Dados são mais importantes
                            metadados_correspondentes.append(f"dados: {termo}")
                
                processos_encontrados[processo_relacionado.id] = {
                    "id": processo_relacionado.id,
                    "titulo": processo_relacionado.titulo,
                    "subtitulo": f"Processo com metadado: {metadado.nome}",
                    "categoria": "Processo por Metadado",
                    "tags": ["processo", "metadado", getattr(metadado, 'lgpd', '').lower()],
                    "tabela": "processos",
                    "relevancia": relevancia,
                    "data_modificacao": getattr(processo_relacionado, 'data_publicacao', None),
                    "colunas_encontradas": metadados_correspondentes,
                    "termos_busca": termos,
                    "link_api": f"/processos/{processo_relacionado.id}",
                    "dados_extras": {
                        "metadado_relacionado": {
                            "id": metadado.id,
                            "nome": metadado.nome,
                            "lgpd": getattr(metadado, 'lgpd', 'N/A'),
                            "dados": metadado.dados if hasattr(metadado, 'dados') else [],
                            "id_processo": getattr(metadado, 'id_processo', None),
                            "id_atividade": getattr(metadado, 'id_atividade', None)
                        },
                        "tipo_busca": "por_metadados",
                        "correspondencia": metadados_correspondentes
                    }
                }
        
        resultados = list(processos_encontrados.values())
        
        # Ordena por relevância
        resultados.sort(key=lambda x: x["relevancia"], reverse=True)
        
        # Limita resultados
        resultados = resultados[:limite]
        
        if not resultados:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Nenhum processo encontrado com metadados contendo: {', '.join(termos)}"
            )
        
        return {
            "resultados": resultados,
            "total_encontrados": len(resultados),
            "termos_busca": termos,
            "tipo_busca": "processos_por_metadados",
            "metadata": {
                "metadados_analisados": len(metadados_unicos),
                "processos_encontrados": len(resultados)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno na busca: {str(e)}"
        )

# Endpoint de busca por metadados simplificado para debug
@router.get("/busca-metadados-simples/", summary="Busca simples em metadados")
async def busca_metadados_simples(
    q: str = Query(..., min_length=2, description="Termo de busca"),
    db: Session = Depends(get_db)
):
    """Busca simples em metadados para debug"""
    try:
        # Busca por nome
        metadados_por_nome = db.query(Metadados).filter(
            Metadados.nome.ilike(f"%{q}%")
        ).all()
        
        # Busca por LGPD
        metadados_por_lgpd = []
        if hasattr(Metadados, 'lgpd'):
            metadados_por_lgpd = db.query(Metadados).filter(
                Metadados.lgpd.ilike(f"%{q}%")
            ).all()
        
        # Busca por dados (fallback manual)
        metadados_por_dados = []
        todos_metadados = db.query(Metadados).all()
        for m in todos_metadados:
            if hasattr(m, 'dados') and m.dados:
                dados_str = str(m.dados).lower()
                if q.lower() in dados_str:
                    metadados_por_dados.append(m)
        
        # Combina resultados
        todos_metadados_lista = metadados_por_nome + metadados_por_lgpd + metadados_por_dados
        metadados_unicos = {m.id: m for m in todos_metadados_lista}
        
        resultados = []
        for metadado in metadados_unicos.values():
            # Busca processo relacionado usando id_processo
            processo = None
            if hasattr(metadado, 'id_processo') and metadado.id_processo:
                processo = db.query(Processo).filter(Processo.id == metadado.id_processo).first()
            
            # Determina onde foi encontrado
            encontrado_em = []
            if q.lower() in metadado.nome.lower():
                encontrado_em.append("nome")
            if hasattr(metadado, 'lgpd') and q.lower() in metadado.lgpd.lower():
                encontrado_em.append("lgpd")
            if hasattr(metadado, 'dados') and metadado.dados:
                dados_str = str(metadado.dados).lower()
                if q.lower() in dados_str:
                    encontrado_em.append("dados")
            
            resultados.append({
                "metadado": {
                    "id": metadado.id,
                    "nome": metadado.nome,
                    "lgpd": getattr(metadado, 'lgpd', 'N/A'),
                    "dados": metadado.dados if hasattr(metadado, 'dados') else [],
                    "id_processo": getattr(metadado, 'id_processo', None),
                    "id_atividade": getattr(metadado, 'id_atividade', None)
                },
                "processo": {
                    "id": processo.id if processo else None,
                    "titulo": processo.titulo if processo else "Sem processo relacionado"
                } if processo else None,
                "encontrado_em": encontrado_em
            })
        
        return {
            "termo_busca": q,
            "total_encontrados": len(resultados),
            "resultados": resultados
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro na busca: {str(e)}"
        )

@router.get("/busca-geral/", summary="Realiza uma busca textual inteligente em todo o banco")
async def busca_geral(
    q: str = Query(..., min_length=2, description="Termo de busca. Mínimo de 2 caracteres."),
    tabelas: Optional[List[str]] = Query(None, description=f"Filtro opcional para tabelas específicas. Opções: {list(MAPEAMENTO_BUSCA.keys())}"),
    limite: int = Query(50, ge=1, le=100, description="Número máximo de resultados por tabela"),
    ordenar_por: str = Query("relevancia", description="Ordenação: 'relevancia', 'alfabetico', 'data'"),
    db: Session = Depends(get_db)
):
    """
    Busca inteligente com:
    - Cálculo de relevância
    - Busca em múltiplas colunas com prioridades
    - Suporte a termos múltiplos
    - Ordenação customizável
    - Highlighting de termos encontrados
    """
    
    # Limpa e separa termos de busca
    termos = [t.strip() for t in re.split(r'\s+', q.strip()) if len(t.strip()) >= 2]
    if not termos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Termo de busca deve ter pelo menos 2 caracteres válidos."
        )
    
    resultados_finais = []
    tabelas_a_buscar = tabelas if tabelas else MAPEAMENTO_BUSCA.keys()

    for nome_tabela in tabelas_a_buscar:
        if nome_tabela not in MAPEAMENTO_BUSCA:
            continue

        config = MAPEAMENTO_BUSCA[nome_tabela]
        modelo = config["modelo"]
        colunas_principais = [c for c in config["colunas"] if c is not None]
        colunas_secundarias = [c for c in config["colunas_secundarias"] if c is not None]
        todas_colunas = colunas_principais + colunas_secundarias
        formatar_resultado = config["resultado"]

        # Constrói filtros para busca multi-termo
        filtros_principais = []
        filtros_secundarios = []
        
        for termo in termos:
            # Busca em colunas principais
            filtros_termo_principal = [coluna.ilike(f"%{termo}%") for coluna in colunas_principais]
            if filtros_termo_principal:
                filtros_principais.append(or_(*filtros_termo_principal))
            
            # Busca em colunas secundárias
            filtros_termo_secundario = [coluna.ilike(f"%{termo}%") for coluna in colunas_secundarias]
            if filtros_termo_secundario:
                filtros_secundarios.append(or_(*filtros_termo_secundario))

        # Combina filtros (AND entre termos, OR entre colunas)
        filtros_finais = []
        if filtros_principais:
            filtros_finais.extend(filtros_principais)
        if filtros_secundarios:
            filtros_finais.extend(filtros_secundarios)
        
        if not filtros_finais:
            continue

        # Executa a query
        query_results = db.query(modelo).filter(or_(*filtros_finais)).limit(limite).all()

        # Processa resultados com cálculo de relevância
        for item in query_results:
            # Para metadados, passa o db_session
            if nome_tabela == "metadados":
                resultado_base = formatar_resultado(item, db)
            else:
                resultado_base = formatar_resultado(item)
            
            # Calcula relevância baseada em onde o termo foi encontrado
            relevancia_total = 0
            colunas_encontradas = []
            
            for coluna in todas_colunas:
                valor_coluna = str(getattr(item, coluna.name, "")).lower()
                for termo in termos:
                    if termo.lower() in valor_coluna:
                        relevancia_total += calcular_relevancia(item, termo, coluna.name)
                        colunas_encontradas.append(coluna.name)
            
            resultado_base["relevancia"] = relevancia_total
            resultado_base["colunas_encontradas"] = list(set(colunas_encontradas))
            resultado_base["termos_busca"] = termos
            resultado_base["tabela"] = nome_tabela
            resultado_base["link_api"] = f"/{nome_tabela}/{item.id}"
            
            resultados_finais.append(resultado_base)

    # Ordenação
    if ordenar_por == "relevancia":
        resultados_finais.sort(key=lambda x: x["relevancia"], reverse=True)
    elif ordenar_por == "alfabetico":
        resultados_finais.sort(key=lambda x: x["titulo"].lower())
    elif ordenar_por == "data" and any(r.get("data_modificacao") for r in resultados_finais):
        resultados_finais.sort(key=lambda x: x.get("data_modificacao") or "", reverse=True)

    if not resultados_finais:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhum resultado encontrado para: {', '.join(termos)}"
        )

    return {
        "resultados": resultados_finais,
        "total_encontrados": len(resultados_finais),
        "termos_busca": termos,
        "tabelas_pesquisadas": list(tabelas_a_buscar),
        "metadata": {
            "ordenacao": ordenar_por,
            "limite_por_tabela": limite
        }
    }

# Endpoint para sugestões de busca (autocomplete)
@router.get("/sugestoes/", summary="Sugestões para autocomplete")
async def obter_sugestoes(
    q: str = Query(..., min_length=1, description="Termo parcial para sugestões"),
    limite: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """Retorna sugestões rápidas para autocomplete baseadas nos termos mais comuns"""
    sugestoes = []
    
    # Busca rápida em campos principais de cada tabela
    for nome_tabela, config in MAPEAMENTO_BUSCA.items():
        modelo = config["modelo"]
        colunas_principais = [c for c in config["colunas"][:1] if c is not None]  # Só primeira coluna
        
        for coluna in colunas_principais:
            try:
                results = db.query(coluna).filter(
                    coluna.ilike(f"%{q}%")
                ).distinct().limit(limite).all()
                
                for result in results:
                    valor = result[0] if result[0] else ""
                    if valor and len(valor.strip()) > 0:
                        sugestoes.append({
                            "texto": valor,
                            "categoria": nome_tabela,
                            "tipo": "sugestao"
                        })
            except Exception as e:
                print(f"Erro ao buscar sugestões em {nome_tabela}: {e}")
                continue
    
    # Remove duplicatas e limita
    sugestoes_unicas = []
    textos_vistos = set()
    for sug in sugestoes:
        if sug["texto"].lower() not in textos_vistos:
            textos_vistos.add(sug["texto"].lower())
            sugestoes_unicas.append(sug)
            if len(sugestoes_unicas) >= limite:
                break
    
    return {"sugestoes": sugestoes_unicas}