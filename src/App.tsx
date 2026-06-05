import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  FolderPlus, 
  Calendar, 
  AlertCircle, 
  Check, 
  Clock, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { dataConnect } from './firebase';
// Data Connect の自動生成された SDK からクエリとミューテーションをインポートします
import { 
  listTodos, 
  listCategories, 
  createTodo, 
  updateTodo, 
  deleteTodo, 
  createCategory 
} from '@firebasegen/todo-connector';

// 取得するカテゴリの型定義
interface Category {
  id: string;
  name: string;
  color: string;
}

// 取得する TODO の型定義
interface Todo {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
}

export default function App() {
  // アプリケーションの状態管理
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フィルタと表示制御の状態
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // TODO新規追加フォームの状態
  const [todoTitle, setTodoTitle] = useState('');
  const [todoDesc, setTodoDesc] = useState('');
  const [todoDueDate, setTodoDueDate] = useState('');
  const [todoPriority, setTodoPriority] = useState('medium');
  const [todoCategoryId, setTodoCategoryId] = useState('');

  // カテゴリ新規追加フォームの状態
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#6366f1');

  // アプリ起動時にデータをロード
  useEffect(() => {
    loadData();
  }, []);

  // データベースからTODOおよびカテゴリの一覧をロードする関数
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Data Connect エミュレータからクエリを実行して最新データを取得 (キャッシュを無効化して即時反映させる)
      const todosResult = await listTodos(dataConnect, { fetchPolicy: 'SERVER_ONLY' });
      const categoriesResult = await listCategories(dataConnect, { fetchPolicy: 'SERVER_ONLY' });

      setTodos((todosResult.data?.todos as Todo[]) || []);
      setCategories((categoriesResult.data?.categories as Category[]) || []);
    } catch (err: any) {
      console.error("データの読み込みエラー:", err);
      setError("データベースとの接続に失敗しました。Docker コンテナおよび Firebase エミュレータが起動しているか確認してください。");
    } finally {
      setLoading(false);
    }
  };

  // 新規TODOを追加する処理
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoTitle.trim()) return;

    try {
      await createTodo(dataConnect, {
        title: todoTitle,
        description: todoDesc || undefined,
        dueDate: todoDueDate || undefined,
        priority: todoPriority,
        categoryId: todoCategoryId || undefined
      });

      // フォームとモーダルの初期化
      setTodoTitle('');
      setTodoDesc('');
      setTodoDueDate('');
      setTodoPriority('medium');
      setTodoCategoryId('');
      setIsAddModalOpen(false);

      // 一覧を再取得
      await loadData();
    } catch (err) {
      console.error("TODO作成エラー:", err);
      alert("TODOの追加に失敗しました。");
    }
  };

  // TODOの完了状態（完了/未完了）をトグルする処理
  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      await updateTodo(dataConnect, {
        id,
        isCompleted: !currentStatus
      });
      await loadData();
    } catch (err) {
      console.error("TODO更新エラー:", err);
      alert("状態の更新に失敗しました。");
    }
  };

  // TODOを削除する処理
  const handleDeleteTodo = async (id: string) => {
    if (!confirm("このタスクを削除しますか？")) return;
    try {
      await deleteTodo(dataConnect, { id });
      await loadData();
    } catch (err) {
      console.error("TODO削除エラー:", err);
      alert("TODOの削除に失敗しました。");
    }
  };

  // 新規カテゴリを作成する処理
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      await createCategory(dataConnect, {
        name: categoryName,
        color: categoryColor
      });

      setCategoryName('');
      setCategoryColor('#6366f1');
      setIsCategoryModalOpen(false);

      await loadData();
    } catch (err) {
      console.error("カテゴリ作成エラー:", err);
      alert("カテゴリの追加に失敗しました。名前が重複している可能性があります。");
    }
  };

  // 期限切れか判定するユーティリティ関数
  const isOverdue = (dueDateStr?: string) => {
    if (!dueDateStr) return false;
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(23, 59, 59, 999); // 期限日の終日までを許容
    return dueDate.getTime() < Date.now();
  };

  // 表示用にTODOリストをフィルタリング
  const filteredTodos = todos.filter(todo => {
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'completed' ? todo.isCompleted : !todo.isCompleted;

    const matchesCategory = 
      selectedCategoryFilter === 'all' ? true :
      todo.category?.id === selectedCategoryFilter;

    return matchesStatus && matchesCategory;
  });

  // 統計情報の算出
  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.isCompleted).length;
  const activeCount = totalCount - completedCount;
  const overdueCount = todos.filter(t => !t.isCompleted && isOverdue(t.dueDate)).length;

  return (
    <div className="app-container">
      {/* ヘッダーセクション */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="brand-title">SQL Connect TODO</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            タスクを追加
          </button>
        </div>
      </header>

      {error && (
        <div className="glass-card" style={{ borderColor: 'var(--color-rose)', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <AlertCircle style={{ color: 'var(--color-rose)' }} size={24} />
          <p style={{ color: 'var(--color-rose)' }}>{error}</p>
        </div>
      )}

      {/* メインダッシュボードコンテンツ */}
      <div className="dashboard-grid">
        {/* 左サイドバー: 統計とカテゴリ管理 */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 統計情報カード */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} style={{ color: 'var(--color-indigo)' }} />
              ダッシュボード
            </h3>
            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-label">すべてのタスク</span>
                <span className="stat-value">{totalCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">完了済み</span>
                <span className="stat-value" style={{ color: 'var(--color-emerald)' }}>{completedCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">未完了</span>
                <span className="stat-value" style={{ color: 'var(--color-indigo)' }}>{activeCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">期限切れ</span>
                <span className="stat-value" style={{ color: overdueCount > 0 ? 'var(--color-rose)' : 'var(--text-muted)' }}>{overdueCount}</span>
              </div>
            </div>
          </div>

          {/* カテゴリ管理カード */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} style={{ color: 'var(--color-cyan)' }} />
                カテゴリ
              </h3>
              <button 
                className="btn btn-text"
                onClick={() => setIsCategoryModalOpen(true)}
                title="カテゴリを追加"
              >
                <FolderPlus size={18} />
              </button>
            </div>

            {/* カテゴリフィルタリスト */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                className={`btn btn-secondary ${selectedCategoryFilter === 'all' ? 'active' : ''}`}
                style={{ 
                  justifyContent: 'flex-start', 
                  background: selectedCategoryFilter === 'all' ? 'var(--color-indigo)' : '',
                  color: selectedCategoryFilter === 'all' ? '#fff' : ''
                }}
                onClick={() => setSelectedCategoryFilter('all')}
              >
                すべてのカテゴリ
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`btn btn-secondary ${selectedCategoryFilter === category.id ? 'active' : ''}`}
                  style={{ 
                    justifyContent: 'flex-start',
                    background: selectedCategoryFilter === category.id ? category.color : '',
                    color: selectedCategoryFilter === category.id ? '#fff' : ''
                  }}
                  onClick={() => setSelectedCategoryFilter(category.id)}
                >
                  <span className="category-dot" style={{ backgroundColor: category.color, border: '1px solid rgba(255,255,255,0.2)' }} />
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 右メインエリア: TODO リスト表示 */}
        <main>
          {/* フィルターとアクションバー */}
          <div className="action-bar glass-card" style={{ padding: '0.75rem 1.25rem' }}>
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                すべて
              </button>
              <button 
                className={`filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                未完了
              </button>
              <button 
                className={`filter-tab ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                完了済み
              </button>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              該当: {filteredTodos.length} 件
            </div>
          </div>

          {loading ? (
            <div className="empty-state glass-card">
              <Clock className="empty-icon" size={48} />
              <p>データを読み込んでいます...</p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="empty-state glass-card">
              <CheckCircle2 className="empty-icon" size={48} />
              <p>該当するタスクはありません。新しく追加しましょう！</p>
            </div>
          ) : (
            <div className="todo-list">
              {filteredTodos.map(todo => {
                const isTodoOverdue = !todo.isCompleted && isOverdue(todo.dueDate);
                return (
                  <div 
                    key={todo.id}
                    className={`todo-item priority-${todo.priority} ${todo.isCompleted ? 'completed' : ''}`}
                  >
                    <div className="todo-main">
                      <div className="todo-checkbox-wrapper">
                        <button
                          type="button"
                          className="todo-checkbox"
                          onClick={() => handleToggleComplete(todo.id, todo.isCompleted)}
                          style={{
                            backgroundColor: todo.isCompleted ? 'var(--color-emerald)' : 'rgba(0,0,0,0.3)',
                            borderColor: todo.isCompleted ? 'var(--color-emerald)' : 'rgba(255,255,255,0.15)'
                          }}
                        >
                          {todo.isCompleted && <Check size={14} color="#fff" strokeWidth={3} />}
                        </button>
                      </div>
                      
                      <div className="todo-content">
                        <h4 className="todo-title">{todo.title}</h4>
                        {todo.description && (
                          <p className="todo-desc">{todo.description}</p>
                        )}
                        
                        <div className="todo-meta">
                          {/* カテゴリバッジ */}
                          {todo.category && (
                            <span className="badge badge-category">
                              <span 
                                className="category-dot" 
                                style={{ backgroundColor: todo.category.color, width: 8, height: 8 }} 
                              />
                              {todo.category.name}
                            </span>
                          )}
                          
                          {/* 優先度バッジ */}
                          <span className={`badge badge-priority ${todo.priority}`}>
                            {todo.priority === 'high' ? '優先度: 高' :
                             todo.priority === 'medium' ? '優先度: 中' : '優先度: 低'}
                          </span>
                          
                          {/* 期限バッジ */}
                          {todo.dueDate && (
                            <span className={`badge badge-date ${isTodoOverdue ? 'overdue' : ''}`}>
                              <Calendar size={12} />
                              {todo.dueDate} {isTodoOverdue && '（期限切れ）'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="todo-actions">
                      <button 
                        className="btn btn-text"
                        style={{ color: 'var(--color-rose)' }}
                        onClick={() => handleDeleteTodo(todo.id)}
                        title="タスクを削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* TODO 追加モーダル */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <h3>新しいタスクの追加</h3>
              <button className="btn btn-text" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTodo}>
              <div className="form-group">
                <label className="form-label">タイトル</label>
                <input 
                  type="text" 
                  className="input-control"
                  placeholder="何をしますか？"
                  value={todoTitle}
                  onChange={e => setTodoTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">説明 (任意)</label>
                <textarea 
                  className="input-control"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="タスクの詳細情報..."
                  value={todoDesc}
                  onChange={e => setTodoDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">期限日</label>
                  <input 
                    type="date" 
                    className="input-control"
                    value={todoDueDate}
                    onChange={e => setTodoDueDate(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">優先度</label>
                  <select 
                    className="input-control"
                    value={todoPriority}
                    onChange={e => setTodoPriority(e.target.value)}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">カテゴリ</label>
                <select 
                  className="input-control"
                  value={todoCategoryId}
                  onChange={e => setTodoCategoryId(e.target.value)}
                >
                  <option value="">カテゴリなし</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  追加する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* カテゴリ 追加モーダル */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>カテゴリの追加</h3>
              <button className="btn btn-text" onClick={() => setIsCategoryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">カテゴリ名</label>
                <input 
                  type="text" 
                  className="input-control"
                  placeholder="例: 仕事、プライベート"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">テーマカラー</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    className="input-control"
                    style={{ width: '60px', padding: '0.2rem', height: '42px', cursor: 'pointer' }}
                    value={categoryColor}
                    onChange={e => setCategoryColor(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {categoryColor.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  作成する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
