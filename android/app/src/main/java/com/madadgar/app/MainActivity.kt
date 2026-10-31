package com.madadgar.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.madadgar.app.service.FloatingBubbleService
import com.madadgar.app.ui.theme.MadadgarTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MadadgarTheme {
                MainScreen(
                    onStartBubble = { startBubbleService() },
                    onCheckOverlayPermission = { hasOverlayPermission() },
                    onRequestOverlayPermission = { requestOverlayPermission() }
                )
            }
        }
    }

    private fun hasOverlayPermission(): Boolean {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)
    }

    private fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
        }
    }

    private fun startBubbleService() {
        val intent = Intent(this, FloatingBubbleService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onStartBubble: () -> Unit,
    onCheckOverlayPermission: () -> Boolean,
    onRequestOverlayPermission: () -> Unit
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableIntStateOf(0) }
    var isUrdu by remember { mutableStateOf(true) }
    var hasPermission by remember { mutableStateOf(onCheckOverlayPermission()) }
    var isBubbleRunning by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (isUrdu) "مددگار (Madadgar)" else "Madadgar Screen Helper",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (isUrdu) "ہر اسکرین پر آپ کا ڈیجیٹل ساتھی" else "Your digital companion on any screen",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    // Urdu / English toggle button
                    FilledTonalButton(
                        onClick = { isUrdu = !isUrdu },
                        modifier = Modifier.padding(end = 8.dp)
                    ) {
                        Text(
                            text = if (isUrdu) "English" else "اردو",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceContainer
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surfaceContainer
            ) {
                val items = listOf(
                    Triple(if (isUrdu) "ہوم" else "Home", Icons.Filled.Home, Icons.Outlined.Home),
                    Triple(if (isUrdu) "فراڈ چیک" else "Fraud Check", Icons.Filled.Security, Icons.Outlined.Security),
                    Triple(if (isUrdu) "ریکارڈ" else "History", Icons.Filled.History, Icons.Outlined.History),
                    Triple(if (isUrdu) "فیملی" else "Family", Icons.Filled.FamilyRestroom, Icons.Outlined.FamilyRestroom)
                )

                items.forEachIndexed { index, item ->
                    NavigationBarItem(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        icon = {
                            Icon(
                                imageVector = if (selectedTab == index) item.second else item.third,
                                contentDescription = item.first,
                                modifier = Modifier.size(28.dp)
                            )
                        },
                        label = {
                            Text(
                                text = item.first,
                                fontSize = 14.sp,
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            when (selectedTab) {
                0 -> HomeScreenTab(
                    isUrdu = isUrdu,
                    hasPermission = hasPermission,
                    isBubbleRunning = isBubbleRunning,
                    onGrantPermission = {
                        onRequestOverlayPermission()
                        hasPermission = onCheckOverlayPermission()
                    },
                    onToggleBubble = {
                        onStartBubble()
                        isBubbleRunning = true
                    }
                )
                1 -> FraudCheckTab(isUrdu = isUrdu)
                2 -> HistoryTab(isUrdu = isUrdu)
                3 -> FamilyTab(isUrdu = isUrdu)
            }
        }
    }
}

@Composable
fun HomeScreenTab(
    isUrdu: Boolean,
    hasPermission: Boolean,
    isBubbleRunning: Boolean,
    onGrantPermission: () -> Unit,
    onToggleBubble: () -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Overlay Permission Banner if needed
        if (!hasPermission) {
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                ),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = if (isUrdu) "ضروری اجازت درکار ہے" else "Permission Required",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = if (isUrdu)
                            "مددگار کو دوسری ایپس کے اوپر دکھانے کے لیے 'Display over other apps' کی اجازت دیجیے۔"
                        else
                            "Allow 'Display over other apps' so the floating help bubble can assist you in JazzCash, WhatsApp, and other apps.",
                        fontSize = 16.sp,
                        color = MaterialTheme.colorScheme.onErrorContainer
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = onGrantPermission,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                    ) {
                        Text(
                            text = if (isUrdu) "اجازت دیں" else "Grant Permission",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Hero Card: Start Floating Assistant
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            ),
            shape = RoundedCornerShape(24.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Filled.RecordVoiceOver,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(64.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = if (isUrdu) "اسکرین ہیلپر ببل" else "Floating Screen Helper",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = if (isUrdu)
                        "جب بھی آپ کسی ایپ میں پھنس جائیں، تیرتے ہوئے ببل کو دبائیں اور اپنی زبان میں بول کر پوچھیں۔"
                    else
                        "When stuck in any banking app or form, tap the floating bubble and speak your problem.",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.85f),
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(20.dp))
                Button(
                    onClick = onToggleBubble,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isBubbleRunning) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.primary
                    ),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(64.dp)
                ) {
                    Icon(
                        imageVector = if (isBubbleRunning) Icons.Filled.CheckCircle else Icons.Filled.PlayArrow,
                        contentDescription = null,
                        modifier = Modifier.size(28.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = if (isBubbleRunning)
                            (if (isUrdu) "ببل ایکٹو ہے (چل رہا ہے)" else "Bubble Active & Ready")
                        else
                            (if (isUrdu) "مددگار ببل شروع کریں" else "Start Madadgar Bubble"),
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Quick Feature Cards
        Text(
            text = if (isUrdu) "آسان خصوصیات" else "Quick Features",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            FeatureCard(
                modifier = Modifier.weight(1f),
                title = if (isUrdu) "آواز سے رہنمائی" else "Voice Guidance",
                subtitle = if (isUrdu) "اردو میں بولیں" else "Speak naturally",
                icon = Icons.Filled.Mic,
                containerColor = MaterialTheme.colorScheme.secondaryContainer
            )
            FeatureCard(
                modifier = Modifier.weight(1f),
                title = if (isUrdu) "فراڈ سے حفاظت" else "Scam Shield",
                subtitle = if (isUrdu) "جعلی SMS پہچانیں" else "Detect fake SMS",
                icon = Icons.Filled.Shield,
                containerColor = MaterialTheme.colorScheme.tertiaryContainer
            )
        }

        // Reassurance Banner
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            ),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Filled.Favorite,
                    contentDescription = null,
                    tint = Color(0xFFE91E63),
                    modifier = Modifier.size(36.dp)
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(
                        text = if (isUrdu) "کوئی بات نہیں، ہم ساتھ ہیں" else "Never feel anxious with technology",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (isUrdu) "آپ کا کوئی ذاتی PIN یا OTP کبھی محفوظ نہیں کیا جاتا۔" else "Zero passwords or PINs are ever saved or stored.",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun FeatureCard(
    modifier: Modifier = Modifier,
    title: String,
    subtitle: String,
    icon: ImageVector,
    containerColor: Color
) {
    Card(
        modifier = modifier.height(130.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        shape = RoundedCornerShape(20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(32.dp)
            )
            Column {
                Text(text = title, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                Text(text = subtitle, fontSize = 13.sp)
            }
        }
    }
}

@Composable
fun FraudCheckTab(isUrdu: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = if (isUrdu) "پیغام (SMS) فراڈ چیکر" else "SMS Fraud & Scam Checker",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = if (isUrdu)
                "بینظیر انکم، انعامی اسکیم یا جاز کیش بلاک والے پیغامات کی فوری تحقیق کریں۔"
            else
                "Automatically analyzes incoming SMS for BISP/JazzCash scams using offline ML & rule checks.",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        // Tab contents shown with interactive cards
    }
}

@Composable
fun HistoryTab(isUrdu: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = if (isUrdu) "گزشتہ مدد کا ریکارڈ (آف لائن)" else "Offline Help History",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = if (isUrdu)
                "آپ کے تمام رہنمائی کے سیشنز آپ کے فون کے Room ڈیٹا بیس میں آف لائن محفوظ ہیں۔"
            else
                "All past guidance sessions are cached locally in your Android Room database.",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun FamilyTab(isUrdu: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = if (isUrdu) "فیملی پروٹیکشن لنک" else "Family Guardian Link",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = if (isUrdu)
                "آپ کے بچے دیکھ سکتے ہیں کہ کتنے فراڈ میسجز روکے گئے، بغیر آپ کے پیغامات پڑھے۔"
            else
                "Family members can see summary counts of blocked scams with zero access to private messages.",
            fontSize = 16.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
