import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Sliders } from 'lucide-react';
import AnchorSection from './components/AnchorSection';
import ContentSection from './components/ContentSection';
import EntitySection from './components/EntitySection';
import RouteSection from './components/RouteSection';
import LinkingPanel from './components/LinkingPanel';
import RouteManagementPanel from './components/RouteManagementPanel';
import CreateContentModal from './components/modals/CreateContentModal';
import CreateProjectModal from './components/modals/CreateProjectModal';
import CCTVEditorModal from './components/modals/CCTVEditorModal';
import ConfirmLinkModal from './components/modals/ConfirmLinkModal';
import ContentPreviewModal from './components/modals/ContentPreviewModal';
import EditAnchorModal from './components/modals/EditAnchorModal';
import EditRouteModal from './components/modals/EditRouteModal';
import EntityAssignmentModal from './components/modals/EntityAssignmentModal';
import EntityCreationModal from './components/modals/EntityCreationModal';
import TextEditorModal from './components/modals/TextEditorModal';
import type {
    Anchor,
    AnchorToRouteLinks,
    ContentItem,
    ContentToAnchorLinks,
    Entity,
    Project,
    PendingLinkAction,
    RouteEntityAssignments,
    Route,
    ContentType,
} from './types';

const initialProjects: Project[] = [
    {
        id: 'proj-1',
        name: 'Fire Safety System',
        description: 'Emergency evacuation and fire safety routes',
    },
    {
        id: 'proj-2',
        name: 'Security Patrol Routes',
        description: 'Daily security patrol paths and checkpoints',
    },
];

const initialContent: ContentItem[] = [
    { id: 'c1', projectId: 'proj-1', name: 'Floor Plan.pdf', type: 'document' },
    { id: 'c2', projectId: 'proj-1', name: 'Unit Photo.jpg', type: 'image' },
    {
        id: 'c3',
        projectId: 'proj-1',
        name: 'CCTV Feed',
        type: 'cctv',
        url: 'https://example.com/stream',
    },
    {
        id: 'c4',
        projectId: 'proj-1',
        name: 'Safety Video',
        type: 'video',
        url: 'https://example.com/video.mp4',
    },
    {
        id: 'c5',
        projectId: 'proj-1',
        name: 'Emergency Procedures',
        type: 'text',
        textContent:
            '<p>In case of fire:</p><ul><li>Stay calm</li><li>Use stairs, not elevators</li><li>Follow exit signs</li></ul>',
    },
];

const initialAnchors: Anchor[] = [
    {
        id: 'a1',
        projectId: 'proj-1',
        name: 'Unit A-101',
        description: 'Primary office',
        type: 'space',
    },
    {
        id: 'a2',
        projectId: 'proj-1',
        name: 'Fire Extinguisher #12',
        description: 'Near elevator lobby',
        type: 'equipment',
    },
    {
        id: 'a3',
        projectId: 'proj-1',
        name: 'East Exit',
        description: 'Leads to assembly point',
        type: 'exit',
    },
];

const initialRoutes: Route[] = [
    {
        id: 'route-1',
        projectId: 'proj-1',
        name: 'North Wing Corridor',
        description: 'Primary evacuation path',
        type: 'evacuation',
        segments: 5,
    },
    {
        id: 'route-2',
        projectId: 'proj-1',
        name: 'Emergency Exit Path A',
        description: 'Secondary route',
        type: 'evacuation',
        segments: 3,
    },
    {
        id: 'route-3',
        projectId: 'proj-1',
        name: 'Main Lobby Circuit',
        description: 'Lobby patrol',
        type: 'patrol',
        segments: 8,
    },
    {
        id: 'route-4',
        projectId: 'proj-1',
        name: 'South Wing Patrol',
        description: 'Night patrol pattern',
        type: 'patrol',
        segments: 4,
    },
];

const initialEntities: Entity[] = [
    {
        id: 'e1',
        projectId: 'proj-1',
        name: 'Security Rover A',
        sourceType: 'manual',
        anchorIds: [],
    },
    {
        id: 'e2',
        projectId: 'proj-1',
        name: 'Fire Wardens',
        sourceType: 'anchor',
        anchorIds: ['a1', 'a3'],
    },
];

const initialContentToAnchorLinks: ContentToAnchorLinks = {
    a1: ['c1', 'c5'],
    a2: ['c2', 'c5'],
};

const initialAnchorToRouteLinks: AnchorToRouteLinks = {
    'route-1-1': ['a1'],
    'route-1-2': ['a2', 'a3'],
    'route-2-1': ['a3'],
    'route-3-4': ['a2'],
};

const buildInitialContentToAnchorToSegmentLinks = () => {
    const links: Record<string, string[]> = {};
    Object.entries(initialContentToAnchorLinks).forEach(
        ([anchorId, contentIds]) => {
            links[`global-${anchorId}`] = contentIds;
        },
    );

    Object.entries(initialAnchorToRouteLinks).forEach(
        ([segmentKey, anchorIds]) => {
            anchorIds.forEach((anchorId) => {
                if (initialContentToAnchorLinks[anchorId]) {
                    links[`${segmentKey}-${anchorId}`] =
                        initialContentToAnchorLinks[anchorId];
                }
            });
        },
    );

    return links;
};

const ConfigurationsView = () => {
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const isOnConfigPage = location.pathname.startsWith('/config');
    const isOnHomePage = location.pathname === '/';
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [selectedProjectId, setSelectedProjectId] = useState<string>(
        initialProjects[0].id,
    );

    const [content, setContent] = useState<ContentItem[]>(initialContent);
    const [anchors, setAnchors] = useState<Anchor[]>(initialAnchors);
    const [routes, setRoutes] = useState<Route[]>(initialRoutes);
    const [entities, setEntities] = useState<Entity[]>(initialEntities);

    const [anchorToRouteLinks, setAnchorToRouteLinks] =
        useState<AnchorToRouteLinks>(initialAnchorToRouteLinks);
    const [contentToAnchorToSegmentLinks, setContentToAnchorToSegmentLinks] =
        useState<Record<string, string[]>>(
            buildInitialContentToAnchorToSegmentLinks,
        );
    const [routesAddedToProject, setRoutesAddedToProject] = useState<string[]>([
        'route-1',
    ]);
    const [routeToEntityAssignments, setRouteToEntityAssignments] =
        useState<RouteEntityAssignments>({});

    const [selectedContentIds, setSelectedContentIds] = useState<string[]>([]);
    const [selectedAnchorIds, setSelectedAnchorIds] = useState<string[]>([]);
    const [selectedRouteForConfig, setSelectedRouteForConfig] = useState<
        string | null
    >(null);
    const [selectedSegmentForLink, setSelectedSegmentForLink] = useState<
        number | null
    >(null);
    const [showLockedRouteMessage, setShowLockedRouteMessage] = useState(false);
    const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
    const [anchorTypeFilter, setAnchorTypeFilter] = useState<string>('all');
    const [routeTypeFilter, setRouteTypeFilter] = useState<string>('all');
    const [contentSearchQuery, setContentSearchQuery] = useState<string>('');
    const [anchorSearchQuery, setAnchorSearchQuery] = useState<string>('');
    const [routeSearchQuery, setRouteSearchQuery] = useState<string>('');
    const [contentDisplayLimit, setContentDisplayLimit] = useState<number>(10);
    const [anchorDisplayLimit, setAnchorDisplayLimit] = useState<number>(8);
    const [routeDisplayLimit, setRouteDisplayLimit] = useState<number>(5);
    const [showRouteManagementPanel, setShowRouteManagementPanel] =
        useState<boolean>(true);

    const [contentPreview, setContentPreview] = useState<ContentItem | null>(
        null,
    );
    const [contentPreviewContext, setContentPreviewContext] = useState<{
        linkKey: string;
        contentIds: string[];
    } | null>(null);
    const [lastEditedItem, setLastEditedItem] = useState<string>('');
    const [currentContentIndex, setCurrentContentIndex] = useState<
        Record<string, number>
    >({});
    const [, setSelectedProjectRouteForView] = useState<string | null>(null);

    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDescription, setNewProjectDescription] = useState('');

    const [showCreateContentModal, setShowCreateContentModal] = useState(false);
    const [newContentName, setNewContentName] = useState('');
    const [newContentType, setNewContentType] =
        useState<ContentType>('document');

    const [showTextEditorModal, setShowTextEditorModal] = useState(false);
    const [textEditorTitle, setTextEditorTitle] = useState('');
    const [textEditorContent, setTextEditorContent] = useState('');
    const [editingTextContentId, setEditingTextContentId] = useState<
        string | null
    >(null);
    const [textEditorMode, setTextEditorMode] = useState<'create' | 'edit'>(
        'create',
    );

    const [showCCTVEditorModal, setShowCCTVEditorModal] = useState(false);
    const [cctvEditorName, setCctvEditorName] = useState('');
    const [cctvEditorUrl, setCctvEditorUrl] = useState('');
    const [editingCctvContentId, setEditingCctvContentId] = useState<
        string | null
    >(null);

    const [anchorBeingEdited, setAnchorBeingEdited] = useState<Anchor | null>(
        null,
    );
    const [routeBeingEdited, setRouteBeingEdited] = useState<Route | null>(
        null,
    );

    const [showEntityCreationModal, setShowEntityCreationModal] =
        useState(false);
    const [newEntityName, setNewEntityName] = useState('');
    const [newEntityDescription, setNewEntityDescription] = useState('');
    const [newEntitySourceType, setNewEntitySourceType] = useState<
        'anchor' | 'manual'
    >('manual');
    const [selectedAnchorsForEntity, setSelectedAnchorsForEntity] = useState<
        string[]
    >([]);

    const [routeForEntityAssignment, setRouteForEntityAssignment] = useState<
        string | null
    >(null);
    const [assignmentSelection, setAssignmentSelection] = useState<string[]>(
        [],
    );

    const [pendingLinkAction, setPendingLinkAction] =
        useState<PendingLinkAction | null>(null);
    const [showConfirmLinkModal, setShowConfirmLinkModal] = useState(false);

    const selectedProject = useMemo(
        () => projects.find((project) => project.id === selectedProjectId),
        [projects, selectedProjectId],
    );

    const projectContent = useMemo(
        () => content.filter((c) => c.projectId === selectedProjectId),
        [content, selectedProjectId],
    );
    const projectAnchors = useMemo(
        () => anchors.filter((a) => a.projectId === selectedProjectId),
        [anchors, selectedProjectId],
    );
    const projectRoutes = useMemo(
        () => routes.filter((r) => r.projectId === selectedProjectId),
        [routes, selectedProjectId],
    );
    const projectEntities = useMemo(
        () => entities.filter((e) => e.projectId === selectedProjectId),
        [entities, selectedProjectId],
    );

    const contentTypes = useMemo(
        () =>
            Array.from(new Set(projectContent.map((c) => c.type))).filter(
                Boolean,
            ),
        [projectContent],
    );
    const anchorTypes = useMemo(
        () =>
            Array.from(
                new Set(projectAnchors.map((a) => a.type).filter(Boolean)),
            ) as string[],
        [projectAnchors],
    );
    const routeTypes = useMemo(
        () =>
            Array.from(
                new Set(projectRoutes.map((r) => r.type).filter(Boolean)),
            ) as string[],
        [projectRoutes],
    );

    useEffect(() => {
        if (!showLockedRouteMessage) return undefined;
        const timeout = window.setTimeout(
            () => setShowLockedRouteMessage(false),
            2400,
        );
        return () => window.clearTimeout(timeout);
    }, [showLockedRouteMessage]);

    const handleContentSelect = (id: string) => {
        setSelectedContentIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        );
    };

    const handleAnchorSelect = (id: string) => {
        setSelectedAnchorIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        );
    };

    const handleRouteSelect = (id: string | null) => {
        setSelectedRouteForConfig(id);
        setSelectedSegmentForLink(null);
        setShowLockedRouteMessage(
            id ? routesAddedToProject.includes(id) : false,
        );
    };

    const handleAddContent = () => {
        setNewContentName('');
        setNewContentType('document');
        setShowCreateContentModal(true);
    };

    const handleAddAnchor = () => {
        const newAnchor: Anchor = {
            id: `a-${Date.now()}`,
            projectId: selectedProjectId,
            name: `New Anchor ${projectAnchors.length + 1}`,
            type: 'checkpoint',
            description: 'Newly added anchor',
        };
        setAnchors((prev) => [...prev, newAnchor]);
        setSelectedAnchorIds((prev) => [...prev, newAnchor.id]);
        setLastEditedItem('Anchor added');
    };

    const handleEditAnchor = (anchor: Anchor) => {
        setAnchorBeingEdited(anchor);
        setLastEditedItem(`Editing anchor: ${anchor.name}`);
    };

    const handleEditRoute = (route: Route) => {
        setRouteBeingEdited(route);
        setLastEditedItem(`Editing route: ${route.name}`);
    };

    const handleLinkAnchorsToRoute = () => {
        if (
            !selectedRouteForConfig ||
            selectedSegmentForLink === null ||
            selectedAnchorIds.length === 0
        )
            return;
        if (routesAddedToProject.includes(selectedRouteForConfig)) {
            setShowLockedRouteMessage(true);
            return;
        }

        const segmentKey = `${selectedRouteForConfig}-${selectedSegmentForLink}`;
        setAnchorToRouteLinks((prev) => {
            const existing = prev[segmentKey] || [];
            const updated = Array.from(
                new Set([...existing, ...selectedAnchorIds]),
            );
            return { ...prev, [segmentKey]: updated };
        });
        setLastEditedItem('Anchors linked to segment');
    };

    const applyContentLink = (
        segmentKey: string,
        anchorIds: string[],
        contentIds: string[],
    ) => {
        setAnchorToRouteLinks((prev) => {
            const existing = prev[segmentKey] || [];
            const updated = Array.from(new Set([...existing, ...anchorIds]));
            return { ...prev, [segmentKey]: updated };
        });

        setContentToAnchorToSegmentLinks((prev) => {
            const updated = { ...prev };
            anchorIds.forEach((anchorId) => {
                const linkKey = `${segmentKey}-${anchorId}`;
                const existing = updated[linkKey] || [];
                updated[linkKey] = Array.from(
                    new Set([...existing, ...contentIds]),
                );
            });
            return updated;
        });

        setCurrentContentIndex((prev) => {
            const updated = { ...prev };
            anchorIds.forEach((anchorId) => {
                const linkKey = `${segmentKey}-${anchorId}`;
                if (updated[linkKey] === undefined) {
                    updated[linkKey] = 0;
                }
            });
            return updated;
        });
    };

    const handleLinkContentToAnchorToSegment = () => {
        if (
            !selectedRouteForConfig ||
            selectedSegmentForLink === null ||
            selectedAnchorIds.length === 0 ||
            selectedContentIds.length === 0
        ) {
            return;
        }

        if (routesAddedToProject.includes(selectedRouteForConfig)) {
            setShowLockedRouteMessage(true);
            return;
        }

        const segmentKey = `${selectedRouteForConfig}-${selectedSegmentForLink}`;

        if (selectedAnchorIds.length > 1 || selectedContentIds.length > 1) {
            setPendingLinkAction({
                type: 'content-anchor-segment',
                anchorIds: [...selectedAnchorIds],
                contentIds: [...selectedContentIds],
                segmentKey,
            });
            setShowConfirmLinkModal(true);
            return;
        }

        applyContentLink(segmentKey, selectedAnchorIds, selectedContentIds);
        setLastEditedItem('Content linked to anchors');
    };

    const handleClearLinking = () => {
        setSelectedContentIds([]);
        setSelectedAnchorIds([]);
        setSelectedRouteForConfig(null);
        setSelectedSegmentForLink(null);
        setShowLockedRouteMessage(false);
        setPendingLinkAction(null);
        setShowConfirmLinkModal(false);
    };

    const handleAddRouteToProject = () => {
        if (!selectedRouteForConfig) return;
        setRoutesAddedToProject((prev) =>
            prev.includes(selectedRouteForConfig)
                ? prev
                : [...prev, selectedRouteForConfig],
        );
        setShowLockedRouteMessage(true);
        setSelectedRouteForConfig(null);
        setSelectedSegmentForLink(null);
        setSelectedAnchorIds([]);
        setSelectedContentIds([]);
        setLastEditedItem('Route added to project');
    };

    const handleAbandonRoute = (routeId: string) => {
        setRoutesAddedToProject((prev) => prev.filter((id) => id !== routeId));
        setAnchorToRouteLinks((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((key) => {
                if (key.startsWith(`${routeId}-`)) {
                    delete updated[key];
                }
            });
            return updated;
        });
        setContentToAnchorToSegmentLinks((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((key) => {
                if (key.startsWith(`${routeId}-`)) {
                    delete updated[key];
                }
            });
            return updated;
        });
        setShowLockedRouteMessage(false);
        if (selectedRouteForConfig === routeId) {
            setSelectedRouteForConfig(null);
            setSelectedSegmentForLink(null);
        }
        if (contentPreviewContext?.linkKey.startsWith(`${routeId}-`)) {
            setContentPreview(null);
            setContentPreviewContext(null);
        }
        setLastEditedItem('Route removed from project');
    };

    const handleRemoveAnchorFromRoute = (
        segmentKey: string,
        anchorId: string,
    ) => {
        setAnchorToRouteLinks((prev) => {
            const updated = { ...prev };
            const filtered = (updated[segmentKey] || []).filter(
                (id) => id !== anchorId,
            );
            if (filtered.length > 0) {
                updated[segmentKey] = filtered;
            } else {
                delete updated[segmentKey];
            }
            return updated;
        });
        setContentToAnchorToSegmentLinks((prev) => {
            const updated = { ...prev };
            delete updated[`${segmentKey}-${anchorId}`];
            return updated;
        });
        setCurrentContentIndex((prev) => {
            const updated = { ...prev };
            delete updated[`${segmentKey}-${anchorId}`];
            return updated;
        });
        if (contentPreviewContext?.linkKey === `${segmentKey}-${anchorId}`) {
            setContentPreview(null);
            setContentPreviewContext(null);
        }
        setLastEditedItem('Anchor removed from route');
    };

    const handleViewLinkedContent = (linkKey: string, contentIds: string[]) => {
        const currentIndex = Math.min(
            currentContentIndex[linkKey] ?? 0,
            contentIds.length - 1,
        );
        setCurrentContentIndex((prev) => ({
            ...prev,
            [linkKey]: currentIndex,
        }));
        const contentToShow = projectContent.find(
            (item) => item.id === contentIds[currentIndex],
        );
        if (contentToShow) {
            setContentPreview(contentToShow);
            setContentPreviewContext({ linkKey, contentIds });
            setLastEditedItem(
                `Previewing linked content (${currentIndex + 1}/${contentIds.length})`,
            );
        }
    };

    const handleCreateEntity = () => {
        const anchorIds = selectedAnchorIds.filter((id) =>
            projectAnchors.some((anchor) => anchor.id === id),
        );
        setNewEntityName('');
        setNewEntityDescription('');
        setNewEntitySourceType(anchorIds.length ? 'anchor' : 'manual');
        setSelectedAnchorsForEntity(anchorIds);
        setShowEntityCreationModal(true);
    };

    const handleRemoveEntity = (id: string) => {
        setEntities((prev) => prev.filter((entity) => entity.id !== id));
        setRouteToEntityAssignments((prev) => {
            const updated: RouteEntityAssignments = {};
            Object.entries(prev).forEach(([routeId, entityIds]) => {
                updated[routeId] = entityIds.filter(
                    (entityId) => entityId !== id,
                );
            });
            return updated;
        });
    };

    const handleManageEntities = (routeId: string) => {
        const route = projectRoutes.find((item) => item.id === routeId);
        const existingAssignments = (
            routeToEntityAssignments[routeId] || []
        ).filter((entityId) =>
            projectEntities.some((entity) => entity.id === entityId),
        );
        setAssignmentSelection(existingAssignments);
        setRouteForEntityAssignment(routeId);
        setLastEditedItem(
            route ? `Manage entities: ${route.name}` : 'Manage route entities',
        );
    };

    const handleViewProjectRoute = (routeId: string | null) => {
        setSelectedProjectRouteForView(routeId);
        setSelectedRouteForConfig(routeId);
        setSelectedSegmentForLink(null);
        setShowLockedRouteMessage(
            routeId ? routesAddedToProject.includes(routeId) : false,
        );
    };

    const handleAddProject = () => {
        setNewProjectName('');
        setNewProjectDescription('');
        setShowCreateProjectModal(true);
    };

    const handleCreateProject = () => {
        if (!newProjectName.trim()) return;
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name: newProjectName.trim(),
            description:
                newProjectDescription.trim() || 'Newly created project',
        };
        setProjects((prev) => [...prev, newProject]);
        setSelectedProjectId(newProject.id);
        setLastEditedItem(`Project created: ${newProject.name}`);
        setShowCreateProjectModal(false);
        setNewProjectName('');
        setNewProjectDescription('');
    };

    const handleCancelCreateProject = () => {
        setShowCreateProjectModal(false);
        setNewProjectName('');
        setNewProjectDescription('');
    };

    const handleSaveNewContent = () => {
        if (!newContentName.trim()) return;
        const newItem: ContentItem = {
            id: `c-${Date.now()}`,
            projectId: selectedProjectId,
            name: newContentName.trim(),
            type: newContentType,
            uploadedAt: new Date().toISOString(),
        };
        if (newContentType === 'text') {
            newItem.textContent = '';
        }
        if (newContentType === 'cctv' && cctvEditorUrl.trim()) {
            newItem.url = cctvEditorUrl.trim();
        }
        setContent((prev) => [...prev, newItem]);
        setSelectedContentIds((prev) => [...prev, newItem.id]);
        setShowCreateContentModal(false);
        setLastEditedItem(`Content added: ${newItem.name}`);
        setNewContentName('');
        setNewContentType('document');
        setCctvEditorUrl('');
    };

    const handleOpenTextEditorForNewContent = () => {
        setTextEditorMode('create');
        setEditingTextContentId(null);
        setTextEditorTitle(
            newContentName || `Text Content ${projectContent.length + 1}`,
        );
        setTextEditorContent('');
        setShowCreateContentModal(false);
        setShowTextEditorModal(true);
    };

    const handleOpenCctvEditorForNewContent = () => {
        setEditingCctvContentId(null);
        setCctvEditorName(
            newContentName || `CCTV Feed ${projectContent.length + 1}`,
        );
        setCctvEditorUrl('');
        setShowCreateContentModal(false);
        setShowCCTVEditorModal(true);
    };

    const handleEditTextContent = (item: ContentItem) => {
        setContentPreview(null);
        setContentPreviewContext(null);
        setTextEditorMode('edit');
        setEditingTextContentId(item.id);
        setTextEditorTitle(item.name);
        setTextEditorContent(item.textContent || '');
        setShowTextEditorModal(true);
    };

    const handleEditCctvContent = (item: ContentItem) => {
        setContentPreview(null);
        setContentPreviewContext(null);
        setEditingCctvContentId(item.id);
        setCctvEditorName(item.name);
        setCctvEditorUrl(item.url || '');
        setShowCCTVEditorModal(true);
    };

    const handleSaveTextContent = () => {
        if (!textEditorTitle.trim()) return;

        if (textEditorMode === 'edit' && editingTextContentId) {
            setContent((prev) =>
                prev.map((item) =>
                    item.id === editingTextContentId
                        ? {
                            ...item,
                            name: textEditorTitle.trim(),
                            textContent: textEditorContent,
                        }
                        : item,
                ),
            );
            setContentPreview((prev) =>
                prev && prev.id === editingTextContentId
                    ? {
                        ...prev,
                        name: textEditorTitle.trim(),
                        textContent: textEditorContent,
                    }
                    : prev,
            );
        } else {
            const newItem: ContentItem = {
                id: `c-${Date.now()}`,
                projectId: selectedProjectId,
                name: textEditorTitle.trim(),
                type: 'text',
                textContent: textEditorContent,
                uploadedAt: new Date().toISOString(),
            };
            setContent((prev) => [...prev, newItem]);
            setSelectedContentIds((prev) => [...prev, newItem.id]);
        }

        setShowTextEditorModal(false);
        setEditingTextContentId(null);
        setTextEditorContent('');
        setTextEditorTitle('');
        setTextEditorMode('create');
        setLastEditedItem('Text content saved');
    };

    const handleFormatText = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    const handleSaveCctvContent = () => {
        if (!cctvEditorName.trim() || !cctvEditorUrl.trim()) return;

        if (editingCctvContentId) {
            setContent((prev) =>
                prev.map((item) =>
                    item.id === editingCctvContentId
                        ? {
                            ...item,
                            name: cctvEditorName.trim(),
                            url: cctvEditorUrl.trim(),
                        }
                        : item,
                ),
            );
            setContentPreview((prev) =>
                prev && prev.id === editingCctvContentId
                    ? {
                        ...prev,
                        name: cctvEditorName.trim(),
                        url: cctvEditorUrl.trim(),
                    }
                    : prev,
            );
        } else {
            const newItem: ContentItem = {
                id: `c-${Date.now()}`,
                projectId: selectedProjectId,
                name: cctvEditorName.trim(),
                type: 'cctv',
                url: cctvEditorUrl.trim(),
                uploadedAt: new Date().toISOString(),
            };
            setContent((prev) => [...prev, newItem]);
            setSelectedContentIds((prev) => [...prev, newItem.id]);
        }

        setShowCCTVEditorModal(false);
        setEditingCctvContentId(null);
        setCctvEditorName('');
        setCctvEditorUrl('');
        setLastEditedItem('CCTV saved');
    };

    const handleCloseTextEditor = () => {
        setShowTextEditorModal(false);
        setEditingTextContentId(null);
        setTextEditorMode('create');
        setTextEditorContent('');
        setTextEditorTitle('');
    };

    const handleCloseCctvEditor = () => {
        setShowCCTVEditorModal(false);
        setEditingCctvContentId(null);
        setCctvEditorName('');
        setCctvEditorUrl('');
    };

    const handleSaveAnchorDetails = () => {
        if (!anchorBeingEdited) return;
        const description = anchorBeingEdited.description?.trim() || '';
        setAnchors((prev) =>
            prev.map((anchor) =>
                anchor.id === anchorBeingEdited.id
                    ? { ...anchor, description }
                    : anchor,
            ),
        );
        setLastEditedItem(`Updated anchor: ${anchorBeingEdited.name}`);
        setAnchorBeingEdited(null);
    };

    const handleSaveRouteDetails = () => {
        if (!routeBeingEdited) return;
        const description = routeBeingEdited.description?.trim() || '';
        setRoutes((prev) =>
            prev.map((route) =>
                route.id === routeBeingEdited.id
                    ? { ...route, description }
                    : route,
            ),
        );
        setLastEditedItem(`Updated route: ${routeBeingEdited.name}`);
        setRouteBeingEdited(null);
    };

    const handleToggleEntityAnchor = (anchorId: string) => {
        setSelectedAnchorsForEntity((prev) =>
            prev.includes(anchorId)
                ? prev.filter((id) => id !== anchorId)
                : [...prev, anchorId],
        );
    };

    const handleSaveEntityCreation = () => {
        if (!newEntityName.trim()) return;
        if (
            newEntitySourceType === 'anchor' &&
            selectedAnchorsForEntity.length === 0
        )
            return;
        const anchorIds = selectedAnchorsForEntity.filter((id) =>
            projectAnchors.some((anchor) => anchor.id === id),
        );
        const newEntity: Entity = {
            id: `entity-${Date.now()}`,
            projectId: selectedProjectId,
            name: newEntityName.trim(),
            description: newEntityDescription.trim() || undefined,
            sourceType: newEntitySourceType,
            anchorIds: newEntitySourceType === 'anchor' ? anchorIds : [],
        };
        setEntities((prev) => [...prev, newEntity]);
        setShowEntityCreationModal(false);
        setSelectedAnchorsForEntity([]);
        setNewEntityName('');
        setNewEntityDescription('');
        setNewEntitySourceType('manual');
        setLastEditedItem('Entity created');
    };

    const handleCancelEntityCreation = () => {
        setShowEntityCreationModal(false);
        setSelectedAnchorsForEntity([]);
        setNewEntityName('');
        setNewEntityDescription('');
        setNewEntitySourceType('manual');
    };

    const handleToggleEntityAssignment = (entityId: string) => {
        setAssignmentSelection((prev) =>
            prev.includes(entityId)
                ? prev.filter((id) => id !== entityId)
                : [...prev, entityId],
        );
    };

    const handleSaveEntityAssignments = (selectedIds: string[]) => {
        if (!routeForEntityAssignment) return;
        setRouteToEntityAssignments((prev) => ({
            ...prev,
            [routeForEntityAssignment]: selectedIds,
        }));
        setRouteForEntityAssignment(null);
        setAssignmentSelection([]);
        setLastEditedItem('Route entities updated');
    };

    const handleCancelEntityAssignment = () => {
        setRouteForEntityAssignment(null);
        setAssignmentSelection([]);
    };

    const handleNavigateContentPreview = (direction: 'prev' | 'next') => {
        if (!contentPreviewContext) return;
        const { linkKey, contentIds } = contentPreviewContext;
        if (contentIds.length === 0) return;
        const total = contentIds.length;
        const currentIndex = currentContentIndex[linkKey] ?? 0;
        let nextIndex =
            direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex < 0) nextIndex = total - 1;
        if (nextIndex >= total) nextIndex = 0;
        const nextContent =
            projectContent.find((item) => item.id === contentIds[nextIndex]) ||
            null;
        setCurrentContentIndex((prev) => ({ ...prev, [linkKey]: nextIndex }));
        setContentPreview(nextContent);
    };

    const handlePreviewContent = (item: ContentItem) => {
        setContentPreview(item);
        setContentPreviewContext(null);
    };

    const handleCloseContentPreview = () => {
        setContentPreview(null);
        setContentPreviewContext(null);
    };

    const handleConfirmLink = () => {
        if (!pendingLinkAction || !pendingLinkAction.segmentKey) return;
        const anchorIds = pendingLinkAction.anchorIds || selectedAnchorIds;
        const contentIds = pendingLinkAction.contentIds || selectedContentIds;
        const segmentKey = pendingLinkAction.segmentKey;
        const routeId = segmentKey.split('-').slice(0, -1).join('-');

        applyContentLink(segmentKey, anchorIds, contentIds);
        setPendingLinkAction(null);
        setShowConfirmLinkModal(false);
        setLastEditedItem(`Linked content to route ${routeId}`);
    };

    const handleCancelLinkConfirmation = () => {
        setPendingLinkAction(null);
        setShowConfirmLinkModal(false);
    };

    const rightColumnSelections = useMemo(
        () => ({
            content: projectContent.filter((c) =>
                selectedContentIds.includes(c.id),
            ),
            anchors: projectAnchors.filter((a) =>
                selectedAnchorIds.includes(a.id),
            ),
            route:
                projectRoutes.find((r) => r.id === selectedRouteForConfig) ||
                null,
        }),
        [
            projectAnchors,
            projectContent,
            projectRoutes,
            selectedAnchorIds,
            selectedContentIds,
            selectedRouteForConfig,
        ],
    );

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                backgroundColor: '#111111',
                color: '#e5e5e5',
                display: 'flex',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    width: '64px',
                    backgroundColor: '#2a2a2a',
                    borderRight: '1px solid #444444',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '16px 0',
                    gap: '8px',
                }}
            >
                <button
                    onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundColor: leftPanelOpen ? '#B12518' : '#3a3a3a',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Search size={20} />
                </button>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundColor: isOnHomePage ? '#B12518' : '#3a3a3a',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Home size={20} />
                </button>
                <button
                    onClick={() => navigate('/config')}
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundColor: isOnConfigPage ? '#B12518' : '#3a3a3a',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Sliders size={20} />
                </button>
            </div>

            <div
                style={{
                    width: leftPanelOpen ? '340px' : '0',
                    backgroundColor: '#2a2a2a',
                    borderRight: '1px solid #444444',
                    overflow: 'hidden',
                    transition: 'width 0.3s ease',
                }}
            >
                {leftPanelOpen && (
                    <div
                        style={{
                            width: '340px',
                            height: '100%',
                            overflowY: 'auto',
                            padding: '16px',
                        }}
                    >
                        <div style={{ marginBottom: '20px' }}>
                            <h2
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    marginBottom: '8px',
                                }}
                            >
                                Routing Module
                            </h2>
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: '#aaaaaa',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                Configuration Mode
                            </div>
                        </div>

                        <div
                            style={{
                                marginBottom: '16px',
                                padding: '12px',
                                borderRadius: '8px',
                                backgroundColor: '#3a3a3a',
                                border: '1px solid #555555',
                            }}
                        >
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '11px',
                                    color: '#aaaaaa',
                                    marginBottom: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                Current Project
                            </label>
                            <select
                                value={selectedProjectId}
                                onChange={(e) =>
                                    setSelectedProjectId(e.target.value)
                                }
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#2a2a2a',
                                    border: '1px solid #555555',
                                    color: '#e5e5e5',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    outline: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            <div
                                style={{
                                    fontSize: '11px',
                                    color: '#888888',
                                    marginTop: '6px',
                                }}
                            >
                                {selectedProject?.description}
                            </div>
                            <button
                                onClick={handleAddProject}
                                style={{
                                    width: '100%',
                                    marginTop: '8px',
                                    padding: '6px',
                                    borderRadius: '6px',
                                    backgroundColor: '#10b981',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                }}
                            >
                                New Project
                            </button>
                        </div>

                        <div>
                            <div style={{ marginBottom: '16px' }}>
                                <button
                                    onClick={() =>
                                        setShowRouteManagementPanel(
                                            !showRouteManagementPanel,
                                        )
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        backgroundColor:
                                            showRouteManagementPanel
                                                ? '#10b981'
                                                : '#3a3a3a',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <span>
                                        {showRouteManagementPanel
                                            ? '✓'
                                            : '○'}
                                    </span>
                                    <span>Route Management</span>
                                    {routesAddedToProject.length > 0 && (
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                padding: '2px 6px',
                                                backgroundColor:
                                                    'rgba(255, 255, 255, 0.2)',
                                                borderRadius: '8px',
                                            }}
                                        >
                                            {routesAddedToProject.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            <ContentSection
                                content={projectContent}
                                selectedContentIds={selectedContentIds}
                                typeFilter={contentTypeFilter}
                                searchQuery={contentSearchQuery}
                                displayLimit={contentDisplayLimit}
                                contentTypes={contentTypes}
                                onTypeFilterChange={setContentTypeFilter}
                                onSearchQueryChange={setContentSearchQuery}
                                onDisplayLimitChange={
                                    setContentDisplayLimit
                                }
                                onContentSelect={handleContentSelect}
                                onAddContent={handleAddContent}
                                onEditText={(item) => {
                                    setLastEditedItem(
                                        `Editing text content: ${item.name}`,
                                    );
                                    handleEditTextContent(item);
                                }}
                                onEditCCTV={(item) => {
                                    setLastEditedItem(
                                        `Editing CCTV: ${item.name}`,
                                    );
                                    handleEditCctvContent(item);
                                }}
                                onPreview={handlePreviewContent}
                            />

                            <AnchorSection
                                anchors={projectAnchors}
                                content={projectContent}
                                selectedAnchorIds={selectedAnchorIds}
                                contentToAnchorToSegmentLinks={
                                    contentToAnchorToSegmentLinks
                                }
                                typeFilter={anchorTypeFilter}
                                searchQuery={anchorSearchQuery}
                                displayLimit={anchorDisplayLimit}
                                anchorTypes={anchorTypes}
                                onTypeFilterChange={setAnchorTypeFilter}
                                onSearchQueryChange={setAnchorSearchQuery}
                                onDisplayLimitChange={setAnchorDisplayLimit}
                                onAnchorSelect={handleAnchorSelect}
                                onAddAnchor={handleAddAnchor}
                                onEditAnchor={handleEditAnchor}
                            />

                            <RouteSection
                                routes={projectRoutes}
                                selectedRouteForConfig={
                                    selectedRouteForConfig
                                }
                                routesAddedToProject={routesAddedToProject}
                                anchorToRouteLinks={anchorToRouteLinks}
                                typeFilter={routeTypeFilter}
                                searchQuery={routeSearchQuery}
                                displayLimit={routeDisplayLimit}
                                routeTypes={routeTypes}
                                onTypeFilterChange={setRouteTypeFilter}
                                onSearchQueryChange={setRouteSearchQuery}
                                onDisplayLimitChange={setRouteDisplayLimit}
                                onRouteSelect={handleRouteSelect}
                                onEditRoute={handleEditRoute}
                            />

                            <EntitySection
                                entities={projectEntities}
                                anchors={projectAnchors}
                                onCreateEntity={handleCreateEntity}
                                onRemoveEntity={handleRemoveEntity}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#121212',
                }}
            >
                <div
                    style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid #1f1f1f',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#888888',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                            }}
                        >
                            Project Overview
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>
                            {selectedProject?.name}
                        </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaaaaa' }}>
                        {lastEditedItem || 'Ready'}
                    </div>
                </div>

                <div
                    style={{
                        padding: '20px 24px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        flex: 1,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid #242424',
                            minHeight: '220px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                marginBottom: '4px',
                            }}
                        >
                            Selections
                        </div>
                        <div style={{ fontSize: '12px', color: '#aaaaaa' }}>
                            {rightColumnSelections.content.length} content •{' '}
                            {rightColumnSelections.anchors.length} anchors •{' '}
                            {rightColumnSelections.route ? 1 : 0} route
                        </div>
                        <div
                            style={{
                                marginTop: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                            }}
                        >
                            {rightColumnSelections.route && (
                                <div
                                    style={{
                                        padding: '10px',
                                        backgroundColor: '#181818',
                                        borderRadius: '8px',
                                        border: '1px solid #2d2d2d',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: '#e5e5e5',
                                        }}
                                    >
                                        {rightColumnSelections.route.name}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            color: '#888888',
                                        }}
                                    >
                                        {rightColumnSelections.route.type ||
                                            'No type'}{' '}
                                        • {rightColumnSelections.route.segments}{' '}
                                        segments
                                    </div>
                                </div>
                            )}

                            {rightColumnSelections.anchors.length > 0 && (
                                <div>
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            color: '#888888',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Anchors
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '6px',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {rightColumnSelections.anchors.map(
                                            (anchor) => (
                                                <span
                                                    key={anchor.id}
                                                    style={{
                                                        fontSize: '10px',
                                                        padding: '6px 8px',
                                                        borderRadius: '6px',
                                                        backgroundColor:
                                                            '#181818',
                                                        border: '1px solid #2d2d2d',
                                                        color: '#e5e5e5',
                                                    }}
                                                >
                                                    {anchor.name}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                            {rightColumnSelections.content.length > 0 && (
                                <div>
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            color: '#888888',
                                            marginBottom: '4px',
                                        }}
                                    >
                                        Content
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '6px',
                                        }}
                                    >
                                        {rightColumnSelections.content.map(
                                            (item) => (
                                                <div
                                                    key={item.id}
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        backgroundColor:
                                                            '#181818',
                                                        border: '1px solid #2d2d2d',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            color: '#e5e5e5',
                                                        }}
                                                    >
                                                        {item.name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#888888',
                                                        }}
                                                    >
                                                        {item.type}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid #242424',
                            minHeight: '220px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}
                    >
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>
                            Content Preview
                        </div>
                        {contentPreview ? (
                            <div>
                                <div
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: '#e5e5e5',
                                    }}
                                >
                                    {contentPreview.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: '11px',
                                        color: '#888888',
                                        marginTop: '2px',
                                    }}
                                >
                                    {contentPreview.type}
                                </div>
                                {contentPreview.textContent ? (
                                    <div
                                        style={{
                                            marginTop: '10px',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            backgroundColor: '#181818',
                                            border: '1px solid #2d2d2d',
                                            color: '#d5d5d5',
                                            fontSize: '12px',
                                            lineHeight: 1.4,
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: contentPreview.textContent,
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            marginTop: '10px',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            backgroundColor: '#181818',
                                            border: '1px dashed #2d2d2d',
                                            color: '#888888',
                                            fontSize: '12px',
                                        }}
                                    >
                                        {contentPreview.url
                                            ? 'External asset link available.'
                                            : 'No preview available.'}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: '20px',
                                    borderRadius: '8px',
                                    backgroundColor: '#181818',
                                    border: '1px dashed #2d2d2d',
                                    color: '#888888',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                }}
                            >
                                Select content to preview
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <LinkingPanel
                selectedContentIds={selectedContentIds}
                selectedAnchorIds={selectedAnchorIds}
                selectedRouteForConfig={selectedRouteForConfig}
                selectedSegmentForLink={selectedSegmentForLink}
                routes={projectRoutes}
                routesAddedToProject={routesAddedToProject}
                showLockedRouteMessage={showLockedRouteMessage}
                onSegmentChange={setSelectedSegmentForLink}
                onLinkContentToAnchorToSegment={
                    handleLinkContentToAnchorToSegment
                }
                onLinkAnchorsToRoute={handleLinkAnchorsToRoute}
                onClear={handleClearLinking}
            />

            {showRouteManagementPanel && (
                <RouteManagementPanel
                    routes={projectRoutes}
                    entities={projectEntities}
                    anchors={projectAnchors}
                    content={projectContent}
                    selectedRouteForConfig={selectedRouteForConfig}
                    routesAddedToProject={routesAddedToProject}
                    selectedSegmentForLink={selectedSegmentForLink}
                    anchorToRouteLinks={anchorToRouteLinks}
                    contentToAnchorToSegmentLinks={
                        contentToAnchorToSegmentLinks
                    }
                    routeToEntityAssignments={routeToEntityAssignments}
                    currentContentIndex={currentContentIndex}
                    onClose={() => setShowRouteManagementPanel(false)}
                    onAddRouteToProject={handleAddRouteToProject}
                    onAbandonRoute={handleAbandonRoute}
                    onViewContent={handleViewLinkedContent}
                    onRemoveAnchor={handleRemoveAnchorFromRoute}
                    onManageEntities={handleManageEntities}
                    onViewProjectRoute={handleViewProjectRoute}
                />
            )}

            <CreateProjectModal
                isOpen={showCreateProjectModal}
                projectName={newProjectName}
                projectDescription={newProjectDescription}
                onNameChange={setNewProjectName}
                onDescriptionChange={setNewProjectDescription}
                onSave={handleCreateProject}
                onCancel={handleCancelCreateProject}
            />

            <CreateContentModal
                isOpen={showCreateContentModal}
                contentName={newContentName}
                contentType={newContentType}
                onNameChange={setNewContentName}
                onTypeChange={setNewContentType}
                onSave={handleSaveNewContent}
                onCancel={() => setShowCreateContentModal(false)}
                onOpenTextEditor={handleOpenTextEditorForNewContent}
                onOpenCCTVEditor={handleOpenCctvEditorForNewContent}
            />

            <TextEditorModal
                isOpen={showTextEditorModal}
                title={textEditorTitle}
                content={textEditorContent}
                onTitleChange={setTextEditorTitle}
                onContentChange={setTextEditorContent}
                onFormat={handleFormatText}
                onSave={handleSaveTextContent}
                onCancel={handleCloseTextEditor}
            />

            <CCTVEditorModal
                isOpen={showCCTVEditorModal}
                name={cctvEditorName}
                url={cctvEditorUrl}
                onNameChange={setCctvEditorName}
                onUrlChange={setCctvEditorUrl}
                onSave={handleSaveCctvContent}
                onCancel={handleCloseCctvEditor}
            />

            <ContentPreviewModal
                content={contentPreview}
                context={contentPreviewContext}
                allContent={projectContent}
                currentContentIndex={currentContentIndex}
                onNavigate={handleNavigateContentPreview}
                onClose={handleCloseContentPreview}
                onEdit={handleEditTextContent}
            />

            <EditAnchorModal
                anchor={anchorBeingEdited}
                onDescriptionChange={(value) =>
                    setAnchorBeingEdited((prev) =>
                        prev ? { ...prev, description: value } : prev,
                    )
                }
                onSave={handleSaveAnchorDetails}
                onCancel={() => setAnchorBeingEdited(null)}
            />

            <EditRouteModal
                route={routeBeingEdited}
                onDescriptionChange={(value) =>
                    setRouteBeingEdited((prev) =>
                        prev ? { ...prev, description: value } : prev,
                    )
                }
                onSave={handleSaveRouteDetails}
                onCancel={() => setRouteBeingEdited(null)}
            />

            <EntityCreationModal
                isOpen={showEntityCreationModal}
                name={newEntityName}
                description={newEntityDescription}
                sourceType={newEntitySourceType}
                selectedAnchorIds={selectedAnchorsForEntity}
                anchors={projectAnchors}
                onNameChange={setNewEntityName}
                onDescriptionChange={setNewEntityDescription}
                onSourceTypeChange={setNewEntitySourceType}
                onAnchorToggle={handleToggleEntityAnchor}
                onSave={handleSaveEntityCreation}
                onCancel={handleCancelEntityCreation}
            />

            <EntityAssignmentModal
                routeId={routeForEntityAssignment}
                routes={projectRoutes}
                entities={projectEntities}
                currentAssignments={assignmentSelection}
                onToggle={handleToggleEntityAssignment}
                onSave={handleSaveEntityAssignments}
                onCancel={handleCancelEntityAssignment}
            />

            <ConfirmLinkModal
                isOpen={showConfirmLinkModal}
                action={pendingLinkAction}
                onConfirm={handleConfirmLink}
                onCancel={handleCancelLinkConfirmation}
            />
        </div>
    );
};

export default ConfigurationsView;
