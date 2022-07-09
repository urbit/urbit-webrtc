import React from 'react'

export const Spinner = ({ className }: { className: string }) => {
    return (
        <span className={`flex-none inline-block relative ${className}`}>
            <span className="block absolute w-full h-full border-2 border-transparent border-t-pink-400 rounded-full animate-spin"></span>
            <span className="block relative w-full h-full border border-pink-700 rounded-full"></span>
        </span>
    )
}