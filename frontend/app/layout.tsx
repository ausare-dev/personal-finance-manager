import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { App as AntdApp } from 'antd';
import { AuthProvider } from '../contexts/AuthContext';
import { AppProvider } from '../contexts/AppContext';
import { ThemeProvider } from '../components/ThemeProvider';
import { FixResponsiveObserver } from './fix-responsive-observer';
import './globals.css';

export const metadata: Metadata = {
	title: 'Персональный финансовый менеджер',
	description: 'Управление личными финансами',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='ru'>
			<body>
				<AntdRegistry>
					<FixResponsiveObserver />
					<AppProvider>
						<ThemeProvider>
							<AntdApp>
								<AuthProvider>{children}</AuthProvider>
							</AntdApp>
						</ThemeProvider>
					</AppProvider>
				</AntdRegistry>
			</body>
		</html>
	);
}
