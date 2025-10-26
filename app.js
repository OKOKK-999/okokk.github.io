class TodoApp {
    constructor() {
        this.apiBase = '/api';
        this.addLog('🚀 前端应用初始化完成');
        this.loadTasks();
        
        // 回车键添加任务
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
    }

    // 添加操作日志
    addLog(message) {
        const logContainer = document.getElementById('logContainer');
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        logItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(logItem);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // API 调用封装
    async callAPI(endpoint, options = {}) {
        try {
            this.addLog(`🌐 调用API: ${endpoint}`);
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            this.addLog(`❌ API调用失败: ${error.message}`);
            throw error;
        }
    }

    // 加载任务列表
    async loadTasks() {
        try {
            this.addLog('📥 正在从服务器获取任务列表...');
            const tasks = await this.callAPI('/tasks');
            this.addLog(`✅ 成功获取 ${tasks.length} 个任务`);
            this.renderTasks(tasks);
            this.updateStats(tasks);
        } catch (error) {
            this.addLog('❌ 加载任务失败，请检查服务器是否运行');
            this.showError('无法连接到服务器，请确保后端服务正在运行');
        }
    }

    // 渲染任务列表
    renderTasks(tasks) {
        const taskList = document.getElementById('taskList');
        
        if (tasks.length === 0) {
            taskList.innerHTML = '<div class="loading">暂无任务，添加第一个任务吧！</div>';
            return;
        }

        taskList.innerHTML = tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="app.toggleTask(${task.id})"
                >
                <span class="task-title">${this.escapeHtml(task.title)}</span>
                <button class="delete-btn" onclick="app.deleteTask(${task.id})">删除</button>
            </div>
        `).join('');
    }

    // HTML转义防止XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 更新统计信息
    updateStats(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;

        document.getElementById('totalCount').textContent = total;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('pendingCount').textContent = pending;
    }

    // 添加新任务
    async addTask() {
        const input = document.getElementById('taskInput');
        const title = input.value.trim();

        if (!title) {
            this.showError('请输入任务内容');
            return;
        }

        try {
            this.addLog(`📤 正在添加任务: "${title}"`);
            await this.callAPI('/tasks', {
                method: 'POST',
                body: JSON.stringify({ title })
            });
            
            input.value = '';
            this.addLog('✅ 任务添加成功，刷新列表...');
            await this.loadTasks();
        } catch (error) {
            this.showError('添加任务失败');
        }
    }

    // 切换任务状态
    async toggleTask(taskId) {
        try {
            this.addLog(`🔄 切换任务 ${taskId} 的状态`);
            await this.callAPI(`/tasks/${taskId}/toggle`, {
                method: 'PATCH'
            });
            this.addLog('✅ 任务状态更新成功');
            await this.loadTasks();
        } catch (error) {
            this.showError('更新任务状态失败');
            await this.loadTasks(); // 重新加载以同步状态
        }
    }

    // 删除任务
    async deleteTask(taskId) {
        if (!confirm('确定要删除这个任务吗？')) {
            return;
        }

        try {
            this.addLog(`🗑️ 正在删除任务 ${taskId}`);
            await this.callAPI(`/tasks/${taskId}`, {
                method: 'DELETE'
            });
            this.addLog('✅ 任务删除成功');
            await this.loadTasks();
        } catch (error) {
            this.showError('删除任务失败');
        }
    }

    // 显示错误信息
    showError(message) {
        alert(`错误: ${message}`);
    }
}

// 创建应用实例
const app = new TodoApp();