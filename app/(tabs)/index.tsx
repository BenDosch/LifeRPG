import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProjectList } from '../../src/components/projects/ProjectList';
import { SideList } from '../../src/components/projects/SideList';
import { useShallow } from 'zustand/react/shallow';
import { useUIStore } from '../../src/store/uiStore';
import { Project } from '../../src/types';

const SIDEBAR_BREAKPOINT = 700;

export default function ProjectsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= SIDEBAR_BREAKPOINT;
  const { sidebarVisible, toggleSidebar } = useUIStore(
    useShallow((s) => ({ sidebarVisible: s.sidebarVisible, toggleSidebar: s.toggleSidebar }))
  );

  const showSidebar = isWide || sidebarVisible;

  const handleAddProject = () => {
    router.push('/modals/project-form');
  };

  const handleEditProject = (project: Project) => {
    router.push({ pathname: '/modals/project-form', params: { projectId: project.id } });
  };

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        {/* Sidebar */}
        {showSidebar && (
          <View style={[styles.sidebar, isWide && styles.sidebarFixed]}>
            <SideList />
          </View>
        )}

        {/* Main content */}
        <View style={styles.main}>
          {/* Toggle button for narrow screens */}
          {!isWide && (
            <TouchableOpacity style={styles.sidebarToggle} onPress={toggleSidebar}>
              <Ionicons
                name={sidebarVisible ? 'chevron-back' : 'menu'}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
          )}

          <View style={styles.listContainer}>
            <ProjectList
              onAddProject={handleAddProject}
              onEditProject={handleEditProject}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 200,
    borderRightWidth: 1,
    borderRightColor: '#1e1e2e',
  },
  sidebarFixed: {
    width: 220,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sidebarToggle: {
    padding: 12,
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
