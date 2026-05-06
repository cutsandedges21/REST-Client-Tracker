import React from 'react'

export function OneTimeTasks({ onTasksChange, onExpensesChange, username }: { onTasksChange?: (tasks: any[]) => void; onExpensesChange?: (expenses: any[]) => void; username?: string }): React.ReactElement