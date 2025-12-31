import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import type { Building, Level } from './types';

type ThreeDToolbarProps = {
    buildingOptions: Building[];
    levelOptions: Level[];
    selectedBuildingName: string;
    onSelectBuilding: (name: string) => void;
    selectedLevel: string;
    onSelectLevel: (name: string) => void;
    canGoBack: boolean;
    onGoBack: () => void;
    onGoHome: () => void;
    gotoEnabled: boolean;
    gotoLabel: string;
    onGoto?: () => void;
    homeEnabled: boolean;
    isModelReady: boolean;
};

const ThreeDToolbar: React.FC<ThreeDToolbarProps> = ({
    buildingOptions,
    levelOptions,
    selectedBuildingName,
    onSelectBuilding,
    selectedLevel,
    onSelectLevel,
    canGoBack,
    onGoBack,
    onGoHome,
    gotoEnabled,
    gotoLabel,
    onGoto,
    homeEnabled,
    isModelReady
}) => {
    const [showBuildingDropdown, setShowBuildingDropdown] = useState(false);
    const [showLevelDropdown, setShowLevelDropdown] = useState(false);
    const [buildingDropdownHeight, setBuildingDropdownHeight] = useState('60vh');
    const [levelDropdownHeight, setLevelDropdownHeight] = useState('60vh');
    const buildingTriggerRef = useRef<HTMLButtonElement | null>(null);
    const levelTriggerRef = useRef<HTMLButtonElement | null>(null);

    const updateDropdownHeights = useCallback(() => {
        const computeAvailableHeight = (trigger: HTMLElement | null) => {
            if (!trigger) return '60vh';
            const rect = trigger.getBoundingClientRect();
            const padding = 16; // keep dropdown from touching viewport edge
            const available = window.innerHeight - rect.bottom - padding;
            return `${Math.max(available, 160)}px`; // ensure a usable minimum height
        };

        setBuildingDropdownHeight(computeAvailableHeight(buildingTriggerRef.current));
        setLevelDropdownHeight(computeAvailableHeight(levelTriggerRef.current));
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.building-dropdown-container')) setShowBuildingDropdown(false);
            if (!target.closest('.level-dropdown-container')) setShowLevelDropdown(false);
        };

        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowBuildingDropdown(false);
                setShowLevelDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscKey);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, []);

    useEffect(() => {
        updateDropdownHeights();
        window.addEventListener('resize', updateDropdownHeights);
        window.addEventListener('scroll', updateDropdownHeights, true);

        return () => {
            window.removeEventListener('resize', updateDropdownHeights);
            window.removeEventListener('scroll', updateDropdownHeights, true);
        };
    }, [updateDropdownHeights]);

    return (
        <div
            className="absolute top-4 left-4 z-20 flex items-center gap-1 p-1.5 rounded-xl"
            style={{
                backgroundColor: 'rgba(26, 26, 26, 0.95)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                border: '1px solid #3a3a3a'
            }}
        >
            <div className="flex items-center gap-1 px-1">
                <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                        backgroundColor: 'transparent',
                        color: canGoBack ? '#e5e5e5' : '#555555',
                        cursor: canGoBack ? 'pointer' : 'not-allowed',
                        opacity: canGoBack ? 1 : 0.6
                    }}
                    onClick={canGoBack ? onGoBack : undefined}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    disabled={!canGoBack}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </button>
                <button
                    className="px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                        backgroundColor: 'transparent',
                        color: homeEnabled ? '#e5e5e5' : '#555555',
                        cursor: homeEnabled ? 'pointer' : 'not-allowed',
                        opacity: homeEnabled ? 1 : 0.6
                    }}
                    onClick={homeEnabled ? onGoHome : undefined}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    disabled={!homeEnabled}
                >
                    Home
                </button>
                <button
                    className="px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                        backgroundColor: gotoEnabled ? '#B12518' : 'transparent',
                        color: gotoEnabled ? 'white' : '#666666',
                        cursor: gotoEnabled ? 'pointer' : 'not-allowed'
                    }}
                    disabled={!gotoEnabled}
                    onClick={gotoEnabled ? onGoto : undefined}
                    onMouseEnter={(e) => {
                        if (gotoEnabled) e.currentTarget.style.backgroundColor = '#8f1e13';
                        else e.currentTarget.style.backgroundColor = '#3a3a3a';
                    }}
                    onMouseLeave={(e) => {
                        if (gotoEnabled) e.currentTarget.style.backgroundColor = '#B12518';
                        else e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    {gotoLabel}
                </button>
            </div>

            <div className="w-px h-8 mx-1" style={{ backgroundColor: '#444444' }}></div>

            <div className="flex items-center gap-1 px-1">
                <div className="relative building-dropdown-container">
                    <button
                        ref={buildingTriggerRef}
                        onClick={() => {
                            if (!isModelReady) return;
                            updateDropdownHeights();
                            setShowBuildingDropdown((prev) => !prev);
                            setShowLevelDropdown(false);
                        }}
                        className="min-w-40 rounded-lg px-3 py-2 text-sm flex items-center justify-between transition-colors"
                        style={{ backgroundColor: 'transparent', color: isModelReady ? '#e5e5e5' : '#555555' }}
                        onMouseEnter={(e) => isModelReady && (e.currentTarget.style.backgroundColor = '#3a3a3a')}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        disabled={!isModelReady}
                    >
                        <span>{selectedBuildingName || '(No building)'}</span>
                        <ChevronDown className="w-4 h-4 ml-2" style={{ color: '#666666' }} />
                    </button>
                    {showBuildingDropdown && (
                        <div
                            className="absolute left-0 z-20 w-full mt-1 rounded-lg shadow-xl overflow-hidden"
                            style={{
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #444444',
                                maxHeight: buildingDropdownHeight,
                                overflowY: 'auto'
                            }}
                        >
                            {buildingOptions.map((building) => (
                                <button
                                    key={building.name}
                                    className="w-full text-left px-3 py-2 text-sm transition-colors"
                                    style={{
                                        backgroundColor: selectedBuildingName === building.name ? '#3a3a3a' : 'transparent',
                                        color: selectedBuildingName === building.name ? '#ff9999' : '#e5e5e5'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedBuildingName === building.name ? '#3a3a3a' : 'transparent'}
                                    onClick={() => {
                                        onSelectBuilding(building.name);
                                        setShowBuildingDropdown(false);
                                    }}
                                >
                                    {building.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative level-dropdown-container">
                    <button
                        ref={levelTriggerRef}
                        onClick={() => {
                            if (!isModelReady) return;
                            updateDropdownHeights();
                            setShowLevelDropdown((prev) => !prev);
                            setShowBuildingDropdown(false);
                        }}
                        className="min-w-30 rounded-lg px-3 py-2 text-sm flex items-center justify-between transition-colors"
                        style={{ backgroundColor: 'transparent', color: isModelReady ? '#e5e5e5' : '#555555' }}
                        onMouseEnter={(e) => isModelReady && (e.currentTarget.style.backgroundColor = '#3a3a3a')}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        disabled={levelOptions.length === 0 || !isModelReady}
                    >
                        <span>{selectedLevel || '(No levels)'}</span>
                        <ChevronDown className="w-4 h-4 ml-2" style={{ color: '#666666' }} />
                    </button>
                    {showLevelDropdown && (
                        <div
                            className="absolute left-0 z-20 w-full mt-1 rounded-lg shadow-xl overflow-hidden"
                            style={{
                                backgroundColor: '#2a2a2a',
                                border: '1px solid #444444',
                                maxHeight: levelDropdownHeight,
                                overflowY: 'auto'
                            }}
                        >
                            {levelOptions.map(({ name }) => (
                                <button
                                    key={name}
                                    className="w-full text-left px-3 py-2 text-sm transition-colors"
                                    style={{
                                        backgroundColor: selectedLevel === name ? '#3a3a3a' : 'transparent',
                                        color: selectedLevel === name ? '#ff9999' : '#e5e5e5'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedLevel === name ? '#3a3a3a' : 'transparent'}
                                    onClick={() => {
                                        onSelectLevel(name);
                                        setShowLevelDropdown(false);
                                    }}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-px h-8 mx-1" style={{ backgroundColor: '#444444' }}></div>
        </div>
    );
};

export default ThreeDToolbar;
